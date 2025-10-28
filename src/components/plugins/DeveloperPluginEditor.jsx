/**
 * Developer Plugin Editor
 * Full code editor with file tree viewer and AI assistance
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  FolderTree,
  FileText,
  Code,
  Code2,
  Play,
  Bug,
  GitBranch,
  Terminal,
  Settings,
  Plus,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  File,
  Folder,
  Search,
  Download,
  Upload,
  Zap,
  Sparkles,
  Wand2, Bot
} from 'lucide-react';
import SaveButton from '@/components/ui/save-button';
import CodeEditor from '@/components/ai-studio/CodeEditor.jsx';
import { useAIStudio, AI_STUDIO_MODES } from '@/contexts/AIStudioContext';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import apiClient from '@/api/client';

const DeveloperPluginEditor = ({
  plugin,
  onSave,
  onClose,
  onSwitchMode,
  initialContext,
  chatMinimized = false,
  fileTreeMinimized: externalFileTreeMinimized,
  setFileTreeMinimized: externalSetFileTreeMinimized,
  editorMinimized: externalEditorMinimized,
  setEditorMinimized: externalSetEditorMinimized,
  fileTreeTargetSize = 20, // Absolute % of total viewport
  editorTargetSize = 50 // Absolute % of total viewport
}) => {
  const { openAI } = useAIStudio();
  const [fileTree, setFileTree] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [expandedFolders, setExpandedFolders] = useState(new Set(['root']));
  const [searchQuery, setSearchQuery] = useState('');
  const [showTerminal, setShowTerminal] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showNewFileDialog, setShowNewFileDialog] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileType, setNewFileType] = useState('controller');
  const [selectedEventName, setSelectedEventName] = useState('');
  const [eventSearchQuery, setEventSearchQuery] = useState('');
  const [showEventMappingDialog, setShowEventMappingDialog] = useState(false);
  const [editingEventName, setEditingEventName] = useState('');

  // Use external state if provided, otherwise use local state
  const fileTreeMinimized = externalFileTreeMinimized ?? false;
  const setFileTreeMinimized = externalSetFileTreeMinimized ?? (() => {});
  const editorMinimized = externalEditorMinimized ?? false;
  const setEditorMinimized = externalSetEditorMinimized ?? (() => {});

  // Convert absolute viewport percentages to relative percentages within this component
  // This component gets (fileTreeTargetSize + editorTargetSize) of the viewport
  const totalSpace = fileTreeTargetSize + editorTargetSize;

  const calculateFileTreeRelativeSize = () => {
    if (fileTreeMinimized) {
      // Calculate relative: if minimized to 3% of viewport, what % is that of our space?
      return (3 / totalSpace) * 100;
    }
    // File tree target (10% of viewport) as % of our space
    return (fileTreeTargetSize / totalSpace) * 100;
  };

  const calculateEditorRelativeSize = () => {
    if (editorMinimized) {
      return (3 / totalSpace) * 100;
    }
    // Editor target (45% of viewport) as % of our space
    return (editorTargetSize / totalSpace) * 100;
  };

  useEffect(() => {
    loadPluginFiles();
  }, [plugin]);

  const loadPluginFiles = async () => {
    try {
      const response = await apiClient.get(`plugins/registry/${plugin.id}`);

      // Build file tree structure
      const files = buildFileTree(response.data);
      setFileTree(files);
    } catch (error) {
      console.error('Error loading plugin files:', error);
    }
  };

  const buildFileTree = (pluginData) => {
    const tree = [
      {
        name: pluginData.name || 'plugin',
        type: 'folder',
        path: '/',
        children: [
          {
            name: 'src',
            type: 'folder',
            path: '/src',
            children: [
              {
                name: 'controllers',
                type: 'folder',
                path: '/src/controllers',
                children: pluginData.controllers?.map(c => ({
                  name: `${c.name}.js`,
                  type: 'file',
                  path: `/src/controllers/${c.name}.js`,
                  content: c.code
                })) || []
              },
              {
                name: 'models',
                type: 'folder',
                path: '/src/models',
                children: pluginData.models?.map(m => ({
                  name: `${m.name}.js`,
                  type: 'file',
                  path: `/src/models/${m.name}.js`,
                  content: m.code
                })) || []
              },
              {
                name: 'components',
                type: 'folder',
                path: '/src/components',
                children: pluginData.components?.map(c => ({
                  name: `${c.name}.jsx`,
                  type: 'file',
                  path: `/src/components/${c.name}.jsx`,
                  content: c.code
                })) || []
              }
            ]
          },
          {
            name: 'hooks',
            type: 'folder',
            path: '/hooks',
            children: pluginData.hooks?.map(h => ({
              name: `${h.hook_name}.js`,
              type: 'file',
              path: `/hooks/${h.hook_name}.js`,
              content: h.handler_code
            })) || []
          },
          {
            name: 'events',
            type: 'folder',
            path: '/events',
            children: pluginData.eventListeners?.map(l => ({
              name: l.file_name,
              type: 'file',
              path: l.file_path,
              content: l.listener_code,
              eventName: l.event_name,
              description: l.description,
              priority: l.priority
            })) || []
          },
          {
            name: 'admin',
            type: 'folder',
            path: '/admin',
            children: pluginData.adminPages?.map(page => ({
              name: `${page.page_key}.jsx`,
              type: 'file',
              path: `/admin/${page.page_key}.jsx`,
              content: page.component_code,
              pageName: page.page_name,
              route: page.route,
              description: page.description,
              icon: page.icon,
              category: page.category
            })) || []
          },
          {
            name: 'manifest.json',
            type: 'file',
            path: '/manifest.json',
            content: JSON.stringify(pluginData.manifest || {}, null, 2)
          },
          {
            name: 'README.md',
            type: 'file',
            path: '/README.md',
            content: pluginData.readme || '# Plugin Documentation'
          }
        ]
      }
    ];

    return tree;
  };

  const toggleFolder = (path) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  const handleFileSelect = (file) => {
    setSelectedFile(file);
    setFileContent(file.content || '');
    setOriginalContent(file.content || '');
  };

  const handleCodeChange = (newCode) => {
    setFileContent(newCode);
  };

  const handleSave = async () => {
    if (!selectedFile) {
      addTerminalOutput('✗ No file selected', 'error');
      setShowTerminal(true);
      return;
    }

    try {
      setIsSaving(true);
      setSaveSuccess(false);

      // Show terminal to display progress
      setShowTerminal(true);
      addTerminalOutput(`⏳ Saving ${selectedFile.name}...`, 'info');

      // Save file changes to backend
      await apiClient.put(`plugins/registry/${plugin.id}/files`, {
        path: selectedFile.path,
        content: fileContent
      });

      setOriginalContent(fileContent);
      setIsSaving(false);
      setSaveSuccess(true);

      // Auto-clear success state after 2 seconds
      setTimeout(() => setSaveSuccess(false), 2000);

      addTerminalOutput(`✓ Saved ${selectedFile.name} successfully`, 'success');

      // Reload file tree to reflect changes
      await loadPluginFiles();
    } catch (error) {
      console.error('Error saving file:', error);
      setIsSaving(false);
      setSaveSuccess(false);
      addTerminalOutput(`✗ Error saving ${selectedFile.name}: ${error.response?.data?.error || error.message}`, 'error');
    }
  };

  const handleAICodeGenerated = (code, files) => {
    if (selectedFile) {
      // Replace current file content with AI-generated code
      setFileContent(code);
      addTerminalOutput('✓ AI generated code applied', 'success');
    } else if (files && files.length > 0) {
      // AI generated new files
      addTerminalOutput(`✓ AI generated ${files.length} new files`, 'success');
      loadPluginFiles(); // Reload file tree
    }
  };

  const addTerminalOutput = (message, type = 'info') => {
    setTerminalOutput(prev => [
      ...prev,
      {
        message,
        type,
        timestamp: new Date().toLocaleTimeString()
      }
    ]);
  };

  const runTests = async () => {
    addTerminalOutput('⚠️ Test endpoint not implemented yet', 'error');
    setShowTerminal(true);

    // TODO: Backend needs to implement POST /api/plugins/registry/:id/test endpoint
    // This should run plugin validation, linting, or other tests
  };

  const handleCreateNewFile = async () => {
    if (!newFileName.trim()) {
      addTerminalOutput('✗ File name cannot be empty', 'error');
      setShowTerminal(true);
      return;
    }

    // Validate event selection for event files
    if (newFileType === 'event' && !selectedEventName) {
      addTerminalOutput('✗ Please select an event for this file to listen to', 'error');
      setShowTerminal(true);
      return;
    }

    try {
      // Determine file path based on type
      let filePath = '';
      let fileExtension = '.js';

      switch (newFileType) {
        case 'controller':
          filePath = `/src/controllers/${newFileName}`;
          fileExtension = '.js';
          break;
        case 'model':
          filePath = `/src/models/${newFileName}`;
          fileExtension = '.js';
          break;
        case 'component':
          filePath = `/src/components/${newFileName}`;
          fileExtension = '.jsx';
          break;
        case 'hook':
          filePath = `/hooks/${newFileName}`;
          fileExtension = '.js';
          break;
        case 'event':
          filePath = `/events/${newFileName}`;
          fileExtension = '.js';
          break;
        default:
          filePath = `/${newFileName}`;
      }

      // Add extension if not present
      if (!filePath.endsWith(fileExtension) && !filePath.includes('.')) {
        filePath += fileExtension;
      }

      addTerminalOutput(`⏳ Creating ${filePath}...`, 'info');
      setShowTerminal(true);

      // Create default content based on file type
      let defaultContent = `// ${newFileName}\n// Created: ${new Date().toISOString()}\n\n`;

      if (newFileType === 'event') {
        defaultContent = `// Event listener for: ${selectedEventName}\n// Created: ${new Date().toISOString()}\n\nreturn function(eventData) {\n  // Your code here\n  console.log('${selectedEventName} fired:', eventData);\n};\n`;
      }

      // For event files, create the event listener mapping in junction table
      if (newFileType === 'event') {
        await apiClient.post(`plugins/${plugin.id}/event-listeners`, {
          file_name: newFileName.endsWith('.js') ? newFileName : `${newFileName}.js`,
          file_path: filePath,
          event_name: selectedEventName,
          listener_function: defaultContent,
          priority: 10,
          description: `Listens to ${selectedEventName}`
        });

        addTerminalOutput(`✓ Created ${filePath} and mapped to ${selectedEventName}`, 'success');
      } else {
        // For non-event files, use the old file save endpoint
        await apiClient.put(`plugins/registry/${plugin.id}/files`, {
          path: filePath,
          content: defaultContent
        });

        addTerminalOutput(`✓ Created ${filePath} successfully`, 'success');
      }

      // Close dialog and reset
      setShowNewFileDialog(false);
      setNewFileName('');
      setNewFileType('controller');
      setSelectedEventName('');
      setEventSearchQuery('');

      // Reload file tree
      await loadPluginFiles();

    } catch (error) {
      console.error('Error creating file:', error);
      addTerminalOutput(`✗ Error creating file: ${error.response?.data?.error || error.message}`, 'error');
    }
  };

  const handleUpdateEventMapping = async () => {
    if (!editingEventName.trim()) {
      addTerminalOutput('✗ Event name cannot be empty', 'error');
      setShowTerminal(true);
      return;
    }

    if (!selectedFile || !selectedFile.eventName) {
      addTerminalOutput('✗ No event file selected', 'error');
      setShowTerminal(true);
      return;
    }

    try {
      addTerminalOutput(`⏳ Updating event mapping to ${editingEventName}...`, 'info');
      setShowTerminal(true);

      // Create or update event listener mapping
      await apiClient.post(`plugins/${plugin.id}/event-listeners`, {
        file_name: selectedFile.name,
        file_path: selectedFile.path,
        event_name: editingEventName,
        listener_function: fileContent,
        priority: selectedFile.priority || 10,
        description: `Listens to ${editingEventName}`
      });

      addTerminalOutput(`✓ Event mapping updated to ${editingEventName}`, 'success');

      // Close dialog and reset
      setShowEventMappingDialog(false);
      setEditingEventName('');

      // Reload file tree
      await loadPluginFiles();

    } catch (error) {
      console.error('Error updating event mapping:', error);
      addTerminalOutput(`✗ Error updating event mapping: ${error.response?.data?.error || error.message}`, 'error');
    }
  };

  const renderFileTree = (nodes, depth = 0) => {
    return nodes.map((node) => {
      const isExpanded = expandedFolders.has(node.path);
      const Icon = node.type === 'folder'
        ? (isExpanded ? ChevronDown : ChevronRight)
        : FileText;

      return (
        <div key={node.path}>
          <div
            className={`flex items-center gap-2 px-2 py-1.5 hover:bg-gray-100 cursor-pointer rounded ${
              selectedFile?.path === node.path ? 'bg-blue-100 text-blue-900' : ''
            }`}
            style={{ paddingLeft: `${depth * 16 + 8}px` }}
            onClick={() => {
              if (node.type === 'folder') {
                toggleFolder(node.path);
              } else {
                handleFileSelect(node);
              }
            }}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm truncate">{node.name}</span>

            {/* Show event name badge for event files */}
            {node.eventName && (
              <Badge className="ml-auto bg-purple-100 text-purple-700 text-xs" title={node.description || `Listens to ${node.eventName}`}>
                {node.eventName}
              </Badge>
            )}

            {/* Show modified badge */}
            {node.type === 'file' && fileContent !== originalContent && selectedFile?.path === node.path && !node.eventName && (
              <Badge className="ml-auto bg-orange-100 text-orange-700 text-xs">M</Badge>
            )}
          </div>
          {node.type === 'folder' && isExpanded && node.children && (
            renderFileTree(node.children, depth + 1)
          )}
        </div>
      );
    });
  };

  return (
    <div className="h-full flex flex-col">
      <ResizablePanelGroup direction="horizontal" className="flex-1" key={`panels-${fileTreeMinimized}-${editorMinimized}`}>
        {/* File Tree Sidebar - Minimizable */}
        <ResizablePanel
          defaultSize={calculateFileTreeRelativeSize()}
          minSize={3}
          maxSize={fileTreeMinimized ? 4 : 50}
          collapsible={false}
        >
          <div className="h-full bg-white border-r overflow-hidden flex flex-col">
            {!fileTreeMinimized ? (
              <>
                <div className="h-12 px-3 border-b bg-gray-50 dark:bg-gray-800 flex items-center justify-between">
                  <div className="flex-1 flex items-center gap-2">
                    <FolderTree className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                      Files
                    </h3>
                  </div>
                  <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFileTreeMinimized(true)}
                      title="Minimize file tree"
                      className="h-6 w-6 p-0"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                  {renderFileTree(fileTree)}
                </div>
                <div className="p-2 border-t bg-gray-50">
                  <Button
                    size="sm"
                    className="w-full"
                    variant="outline"
                    onClick={() => setShowNewFileDialog(true)}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    New File
                  </Button>
                </div>
              </>
            ) : (
              <div className="h-full flex pt-2 justify-center bg-gray-50">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFileTreeMinimized(false)}
                  title="Expand file tree"
                  className="p-2 hover:bg-gray-100"
                >
                  <FolderTree className="w-5 h-5 text-blue-600" />
                </Button>
              </div>
            )}
          </div>
        </ResizablePanel>

        <ResizableHandle />

        {/* Main Editor Area - Minimizable */}
        <ResizablePanel
          defaultSize={calculateEditorRelativeSize()}
          minSize={3}
          maxSize={editorMinimized ? 4 : 100}
          collapsible={false}
        >
          <div className="h-full flex flex-col bg-white rounded-lg overflow-hidden">
            {!editorMinimized ? (
              <>
                {/* Editor Header */}
                <div className="h-12 px-3 border-b bg-gray-50 flex items-center justify-between">
                    {selectedFile ? (
                      <>
                        <div className="flex items-center gap-3">
                          <Code2 className="w-4 h-4 text-blue-600" />
                          <FileText className="w-4 h-4 text-gray-600" />
                          <span className="font-medium">{selectedFile.name}</span>
                          <span className="text-sm text-gray-500">{selectedFile.path}</span>
                          {fileContent !== originalContent && (
                            <Badge className="bg-orange-100 text-orange-700 text-xs">
                              Modified
                            </Badge>
                          )}
                          {selectedFile.eventName && (
                            <Badge className="bg-purple-100 text-purple-700 text-xs">
                              → {selectedFile.eventName}
                            </Badge>
                          )}
                        </div>
                      </>
                    ) : (
                        <div className="flex items-center gap-3">
                          <Code2 className="w-4 h-4 text-blue-600" />
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                            Code Editor
                          </h3>
                        </div>
                    )}

                  <div className="flex items-center gap-2">
                    {/* Edit Event Mapping button - only for event files */}
                    {selectedFile?.eventName && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingEventName(selectedFile.eventName);
                          setShowEventMappingDialog(true);
                        }}
                        title="Edit which event this file listens to"
                      >
                        <Zap className="w-4 h-4 mr-1" />
                        Edit Event
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={runTests}
                    >
                      <Bug className="w-4 h-4 mr-1" />
                      Test
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowTerminal(!showTerminal)}
                    >
                      <Terminal className="w-4 h-4 mr-1" />
                      Terminal
                    </Button>
                    <SaveButton
                      size="sm"
                      onClick={handleSave}
                      loading={isSaving}
                      success={saveSuccess}
                      disabled={!selectedFile || fileContent === originalContent}
                      defaultText="Save"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditorMinimized(true)}
                      title="Minimize editor"
                      className="h-6 w-6 p-0"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Code Editor */}
                <div className="flex-1 overflow-hidden">
                  {selectedFile ? (
                    <CodeEditor
                      value={fileContent}
                      onChange={handleCodeChange}
                      fileName={selectedFile.name}
                      originalCode={originalContent}
                      enableDiffDetection={true}
                      enableTabs={false}
                      className="h-full"
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <Code className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          Select a file to edit
                        </h3>
                        <p className="text-sm">
                          Choose a file from the tree on the left to start coding
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Terminal */}
                {showTerminal && (
                  <div className="h-48 border-t bg-gray-900 text-green-400 font-mono text-sm overflow-y-auto p-4">
                    {terminalOutput.map((output, index) => (
                      <div
                        key={index}
                        className={`mb-1 ${
                          output.type === 'error' ? 'text-red-400' :
                          output.type === 'success' ? 'text-green-400' :
                          'text-gray-400'
                        }`}
                      >
                        <span className="text-gray-600">[{output.timestamp}]</span> {output.message}
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="h-full flex items-center justify-center bg-gray-50">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditorMinimized(false)}
                  title="Expand editor"
                  className="p-2 hover:bg-gray-100"
                >
                  <Code2 className="w-5 h-5 text-blue-600" />
                </Button>
              </div>
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* New File Dialog */}
      {showNewFileDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-96 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Create New File</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  File Name
                </label>
                <Input
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder={newFileType === 'event' ? 'e.g., analytics_tracker' : 'e.g., UserController'}
                  className="w-full"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newFileType !== 'event') {
                      handleCreateNewFile();
                    } else if (e.key === 'Escape') {
                      setShowNewFileDialog(false);
                    }
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  File Type
                </label>
                <select
                  value={newFileType}
                  onChange={(e) => {
                    setNewFileType(e.target.value);
                    setSelectedEventName('');
                    setEventSearchQuery('');
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="controller">Controller (.js)</option>
                  <option value="model">Model (.js)</option>
                  <option value="component">Component (.jsx)</option>
                  <option value="hook">Hook (.js)</option>
                  <option value="event">Event Listener (.js)</option>
                </select>
              </div>

              {/* Event Selection - Only for Event type */}
              {newFileType === 'event' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Event to Listen To *
                  </label>
                  <Input
                    value={eventSearchQuery}
                    onChange={(e) => setEventSearchQuery(e.target.value)}
                    placeholder="Search events..."
                    className="w-full mb-2"
                  />

                  <div className="border border-gray-300 rounded-md max-h-48 overflow-y-auto">
                    {/* Common Cart Events */}
                    {['cart.viewed', 'cart.itemsLoaded', 'cart.quantityUpdated', 'cart.itemRemoved', 'cart.checkoutStarted', 'cart.checkoutBlocked']
                      .filter(event => event.toLowerCase().includes(eventSearchQuery.toLowerCase()))
                      .map(event => (
                        <div
                          key={event}
                          className={`px-3 py-2 cursor-pointer hover:bg-blue-50 ${selectedEventName === event ? 'bg-blue-100 font-medium' : ''}`}
                          onClick={() => setSelectedEventName(event)}
                        >
                          <div className="text-sm font-medium text-gray-900">{event}</div>
                          <div className="text-xs text-gray-500">
                            {event === 'cart.viewed' && 'Cart page loads'}
                            {event === 'cart.itemsLoaded' && 'Cart items loaded from API'}
                            {event === 'cart.quantityUpdated' && 'Item quantity changed'}
                            {event === 'cart.itemRemoved' && 'Item removed from cart'}
                            {event === 'cart.checkoutStarted' && 'User clicks checkout'}
                            {event === 'cart.checkoutBlocked' && 'Checkout blocked (empty cart)'}
                          </div>
                        </div>
                      ))}

                    {/* Product Events */}
                    {['product.view', 'product.list']
                      .filter(event => event.toLowerCase().includes(eventSearchQuery.toLowerCase()))
                      .map(event => (
                        <div
                          key={event}
                          className={`px-3 py-2 cursor-pointer hover:bg-blue-50 ${selectedEventName === event ? 'bg-blue-100 font-medium' : ''}`}
                          onClick={() => setSelectedEventName(event)}
                        >
                          <div className="text-sm font-medium text-gray-900">{event}</div>
                          <div className="text-xs text-gray-500">
                            {event === 'product.view' && 'Product page viewed'}
                            {event === 'product.list' && 'Product list rendered'}
                          </div>
                        </div>
                      ))}

                    {/* Order Events */}
                    {['order.after_create', 'order.status_change']
                      .filter(event => event.toLowerCase().includes(eventSearchQuery.toLowerCase()))
                      .map(event => (
                        <div
                          key={event}
                          className={`px-3 py-2 cursor-pointer hover:bg-blue-50 ${selectedEventName === event ? 'bg-blue-100 font-medium' : ''}`}
                          onClick={() => setSelectedEventName(event)}
                        >
                          <div className="text-sm font-medium text-gray-900">{event}</div>
                          <div className="text-xs text-gray-500">
                            {event === 'order.after_create' && 'Order created'}
                            {event === 'order.status_change' && 'Order status changed'}
                          </div>
                        </div>
                      ))}

                    {/* Custom Event Option */}
                    {eventSearchQuery && !['cart.viewed', 'cart.itemsLoaded', 'cart.quantityUpdated', 'cart.itemRemoved', 'cart.checkoutStarted', 'cart.checkoutBlocked', 'product.view', 'product.list', 'order.after_create', 'order.status_change'].includes(eventSearchQuery) && (
                      <div
                        className={`px-3 py-2 cursor-pointer hover:bg-blue-50 border-t ${selectedEventName === eventSearchQuery ? 'bg-blue-100 font-medium' : ''}`}
                        onClick={() => setSelectedEventName(eventSearchQuery)}
                      >
                        <div className="text-sm font-medium text-gray-900">✨ Use custom: {eventSearchQuery}</div>
                        <div className="text-xs text-gray-500">Create a custom event listener</div>
                      </div>
                    )}
                  </div>

                  {selectedEventName && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-800">
                      ✓ Will listen to: <strong>{selectedEventName}</strong>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-6">
              <Button
                onClick={handleCreateNewFile}
                className="flex-1"
                disabled={newFileType === 'event' && !selectedEventName}
              >
                Create
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowNewFileDialog(false);
                  setNewFileName('');
                  setNewFileType('controller');
                  setSelectedEventName('');
                  setEventSearchQuery('');
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Event Mapping Dialog */}
      {showEventMappingDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Edit Event Mapping</h3>

            <div className="mb-4 p-3 bg-gray-50 rounded">
              <div className="text-sm text-gray-600 mb-1">File:</div>
              <div className="font-medium">{selectedFile?.name}</div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Name
                </label>
                <Input
                  value={editingEventName}
                  onChange={(e) => setEditingEventName(e.target.value)}
                  placeholder="e.g., cart.viewed or product.added"
                  className="w-full"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleUpdateEventMapping();
                    } else if (e.key === 'Escape') {
                      setShowEventMappingDialog(false);
                    }
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Examples: cart.viewed, product.view, order.after_create
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <div className="text-xs font-medium text-blue-900 mb-1">💡 Common Events:</div>
                <div className="text-xs text-blue-800 space-y-1">
                  <div>• cart.viewed - Cart page loads</div>
                  <div>• cart.itemsLoaded - Cart items loaded</div>
                  <div>• product.view - Product page viewed</div>
                  <div>• order.after_create - Order created</div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button
                onClick={handleUpdateEventMapping}
                className="flex-1"
              >
                Update
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowEventMappingDialog(false);
                  setEditingEventName('');
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeveloperPluginEditor;
