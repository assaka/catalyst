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
  Save,
  Play,
  Bug,
  GitBranch,
  Terminal,
  Settings,
  Plus,
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  Search,
  Download,
  Upload,
  RefreshCw,
  Zap,
  Sparkles,
  Wand2
} from 'lucide-react';
import CodeEditor from '@/components/editor/ai-context/CodeEditor';
import PluginAIAssistant from './PluginAIAssistant';
import apiClient from '@/api/client';

const DeveloperPluginEditor = ({ plugin, onSave, onClose, onSwitchMode, initialContext }) => {
  const [fileTree, setFileTree] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [expandedFolders, setExpandedFolders] = useState(new Set(['root']));
  const [searchQuery, setSearchQuery] = useState('');
  const [showTerminal, setShowTerminal] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState([]);

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
            children: pluginData.events?.map(e => ({
              name: `${e.event_name}.js`,
              type: 'file',
              path: `/events/${e.event_name}.js`,
              content: e.listener_code
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
      // Show terminal to display progress
      setShowTerminal(true);
      addTerminalOutput(`⏳ Saving ${selectedFile.name}...`, 'info');

      // Save file changes to backend
      await apiClient.put(`plugins/registry/${plugin.id}/files`, {
        path: selectedFile.path,
        content: fileContent
      });

      setOriginalContent(fileContent);
      addTerminalOutput(`✓ Saved ${selectedFile.name} successfully`, 'success');

      // Reload file tree to reflect changes
      await loadPluginFiles();
    } catch (error) {
      console.error('Error saving file:', error);
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
    addTerminalOutput('Running tests...', 'info');
    setShowTerminal(true);

    try {
      const response = await apiClient.post(`plugins/registry/${plugin.id}/test`);
      addTerminalOutput(response.output, 'success');
    } catch (error) {
      addTerminalOutput(`Test failed: ${error.message}`, 'error');
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
            {node.type === 'file' && fileContent !== originalContent && selectedFile?.path === node.path && (
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
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Mode Switcher Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Code2 className="w-6 h-6 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">Developer Mode</h1>
                <Badge className="bg-blue-100 text-blue-700">Full Control</Badge>
              </div>
              <p className="text-sm text-gray-600">Code editor with AI assistance</p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSwitchMode?.('nocode-ai', { plugin })}
                className="gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Switch to No-Code AI
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSwitchMode?.('guided', { plugin })}
                className="gap-2"
              >
                <Wand2 className="w-4 h-4" />
                Switch to Guided
              </Button>
              <Button variant="ghost" onClick={onClose}>Close</Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex gap-4 p-6 overflow-hidden">
      {/* File Tree Sidebar */}
      <div className="w-64 bg-white rounded-lg shadow-lg overflow-hidden flex flex-col">
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center gap-2 mb-3">
            <FolderTree className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold">Files</h3>
          </div>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files..."
              className="pl-8 h-8 text-sm"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {renderFileTree(fileTree)}
        </div>
        <div className="p-2 border-t bg-gray-50">
          <Button size="sm" className="w-full" variant="outline">
            <Plus className="w-4 h-4 mr-1" />
            New File
          </Button>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 bg-white rounded-lg shadow-lg overflow-hidden flex flex-col">
        {/* Editor Header */}
        <div className="p-3 border-b bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {selectedFile ? (
              <>
                <FileText className="w-4 h-4 text-gray-600" />
                <span className="font-medium">{selectedFile.name}</span>
                <span className="text-sm text-gray-500">{selectedFile.path}</span>
                {fileContent !== originalContent && (
                  <Badge className="bg-orange-100 text-orange-700 text-xs">
                    Modified
                  </Badge>
                )}
              </>
            ) : (
              <span className="text-gray-500">No file selected</span>
            )}
          </div>
          <div className="flex items-center gap-2">
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
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!selectedFile || fileContent === originalContent}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="w-4 h-4 mr-1" />
              Save
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
      </div>

      {/* AI Assistant Sidebar */}
      <div className="w-96 bg-white rounded-lg shadow-lg overflow-hidden">
        <PluginAIAssistant
          mode="developer"
          onCodeGenerated={handleAICodeGenerated}
          currentContext={{
            plugin,
            currentFile: selectedFile,
            currentCode: fileContent
          }}
        />
      </div>
      </div>
    </div>
  );
};

export default DeveloperPluginEditor;
