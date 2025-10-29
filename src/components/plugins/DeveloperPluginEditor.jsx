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
  Wand2,
  Bot,
  Database,
  Trash2
} from 'lucide-react';
import SaveButton from '@/components/ui/save-button';
import CodeEditor from '@/components/ai-studio/CodeEditor.jsx';
import { useAIStudio, AI_STUDIO_MODES } from '@/contexts/AIStudioContext';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import apiClient from '@/api/client';
import EventSelector from '@/components/plugins/EventSelector';

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
  const [editingFileName, setEditingFileName] = useState('');
  const [isRunningMigration, setIsRunningMigration] = useState(false);
  const [showMigrationConfirm, setShowMigrationConfirm] = useState(false);
  const [migrationResult, setMigrationResult] = useState(null);
  const [showMigrationsPanel, setShowMigrationsPanel] = useState(false);
  const [allMigrations, setAllMigrations] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
      // Calculate relative: if minimized to 4% of viewport, what % is that of our space?
      return (4 / totalSpace) * 100;
    }
    // File tree target (15% of viewport) as % of our space
    return (fileTreeTargetSize / totalSpace) * 100;
  };

  const calculateEditorRelativeSize = () => {
    if (editorMinimized) {
      return (4 / totalSpace) * 100;
    }
    // Editor target (40% of viewport) as % of our space
    return (editorTargetSize / totalSpace) * 100;
  };

  useEffect(() => {
    loadPluginFiles();
  }, [plugin]);

  const loadPluginFiles = async () => {
    try {
      const response = await apiClient.get(`plugins/registry/${plugin.id}`);

      // Extract migrations for status panel
      const migrationsFromFiles = (response.data.source_code || [])
        .filter(f => f.name?.startsWith('migrations/'))
        .map(m => ({
          version: m.migration_version,
          description: m.migration_description,
          status: m.migration_status,
          executed_at: m.executed_at,
          name: m.name
        }));

      const entitiesFromFiles = (response.data.source_code || [])
        .filter(f => f.name?.startsWith('entities/'))
        .map(e => ({
          entity_name: e.entity_name,
          table_name: e.table_name,
          migration_status: e.migration_status
        }));

      setAllMigrations(migrationsFromFiles);

      console.log('📊 Loaded migrations:', migrationsFromFiles.length);
      console.log('📦 Loaded entities:', entitiesFromFiles.length);

      console.log('📦 Plugin API Response:', response.data);
      console.log('📄 Source Code Files:', response.data.source_code);
      console.log('📋 Event Listeners:', response.data.eventListeners);
      console.log('🪝 Hooks:', response.data.hooks);

      // Build file tree structure
      const files = buildFileTree(response.data);
      setFileTree(files);
    } catch (error) {
      console.error('Error loading plugin files:', error);
    }
  };

  const buildFileTree = (pluginData) => {
    // Helper function to build dynamic tree from file paths
    const buildDynamicTree = (files) => {
      const root = {
        name: pluginData.name || 'plugin',
        type: 'folder',
        path: '/',
        children: []
      };

      // Create a map to track folder nodes
      const folderMap = { '/': root };

      files.forEach(file => {
        const fileName = file.name || '';
        const fileCode = file.code || '';

        // Normalize path - remove leading 'src/' if present, we'll add it back in structure
        let normalizedPath = fileName.replace(/^src\//, '');

        // Ensure path starts with /
        if (!normalizedPath.startsWith('/')) {
          normalizedPath = '/' + normalizedPath;
        }

        // Split path into parts
        const parts = normalizedPath.split('/').filter(p => p);

        // Build folder structure
        let currentPath = '';
        let currentFolder = root;

        // Process all parts except the last one (which is the file)
        for (let i = 0; i < parts.length - 1; i++) {
          currentPath += '/' + parts[i];

          if (!folderMap[currentPath]) {
            const newFolder = {
              name: parts[i],
              type: 'folder',
              path: currentPath,
              children: []
            };
            currentFolder.children.push(newFolder);
            folderMap[currentPath] = newFolder;
          }

          currentFolder = folderMap[currentPath];
        }

        // Add the file to its parent folder
        if (parts.length > 0) {
          const fileNode = {
            name: parts[parts.length - 1],
            type: 'file',
            path: normalizedPath,
            content: fileCode,
            // Preserve metadata from source file (eventName, priority, etc.)
            ...(file.eventName && { eventName: file.eventName }),
            ...(file.priority && { priority: file.priority }),
            ...(file.description && { description: file.description })
          };
          currentFolder.children.push(fileNode);
        }
      });

      return root;
    };

    // Get all files from source_code or generatedFiles
    const allFiles = pluginData.source_code || pluginData.manifest?.generatedFiles || [];

    console.log('🌳 Building file tree from files:', allFiles);
    console.log('📊 Total files to process:', allFiles.length);

    // Build dynamic tree from files
    // For event files from plugin_events table, preserve event_name metadata
    const tree = buildDynamicTree(allFiles.map(file => ({
      ...file,
      eventName: file.event_name || file.eventName, // Normalize event_name → eventName
      priority: file.priority
    })));

    // Add special categorized files with metadata (event listeners, hooks, admin pages)
    // These need special handling because they have extra metadata

    // Add event listeners with metadata
    if (pluginData.eventListeners && pluginData.eventListeners.length > 0) {
      let eventsFolder = tree.children.find(f => f.name === 'events');
      if (!eventsFolder) {
        eventsFolder = {
          name: 'events',
          type: 'folder',
          path: '/events',
          children: []
        };
        tree.children.push(eventsFolder);
      }

      // Replace or add event listener files with metadata
      pluginData.eventListeners.forEach(listener => {
        const existingIndex = eventsFolder.children.findIndex(f => f.path === listener.file_path);
        const eventFile = {
          name: listener.file_name,
          type: 'file',
          path: listener.file_path,
          content: listener.listener_code,
          eventName: listener.event_name,
          description: listener.description,
          priority: listener.priority
        };

        if (existingIndex >= 0) {
          eventsFolder.children[existingIndex] = eventFile;
        } else {
          eventsFolder.children.push(eventFile);
        }
      });
    }

    // Add admin pages with metadata
    if (pluginData.adminPages && pluginData.adminPages.length > 0) {
      let adminFolder = tree.children.find(f => f.name === 'admin');
      if (!adminFolder) {
        adminFolder = {
          name: 'admin',
          type: 'folder',
          path: '/admin',
          children: []
        };
        tree.children.push(adminFolder);
      }

      // Replace or add admin page files with metadata
      pluginData.adminPages.forEach(page => {
        const pagePath = `/admin/${page.page_key}.jsx`;
        const existingIndex = adminFolder.children.findIndex(f => f.path === pagePath);
        const pageFile = {
          name: `${page.page_key}.jsx`,
          type: 'file',
          path: pagePath,
          content: page.component_code,
          pageName: page.page_name,
          route: page.route,
          description: page.description,
          icon: page.icon,
          category: page.category
        };

        if (existingIndex >= 0) {
          adminFolder.children[existingIndex] = pageFile;
        } else {
          adminFolder.children.push(pageFile);
        }
      });
    }

    // Add hooks with metadata
    if (pluginData.hooks && pluginData.hooks.length > 0) {
      let hooksFolder = tree.children.find(f => f.name === 'hooks');
      if (!hooksFolder) {
        hooksFolder = {
          name: 'hooks',
          type: 'folder',
          path: '/hooks',
          children: []
        };
        tree.children.push(hooksFolder);
      }

      // Replace or add hook files with metadata
      pluginData.hooks.forEach(hook => {
        const hookPath = `/hooks/${hook.hook_name}.js`;
        const existingIndex = hooksFolder.children.findIndex(f => f.path === hookPath);
        const hookFile = {
          name: `${hook.hook_name}.js`,
          type: 'file',
          path: hookPath,
          content: hook.handler_code
        };

        if (existingIndex >= 0) {
          hooksFolder.children[existingIndex] = hookFile;
        } else {
          hooksFolder.children.push(hookFile);
        }
      });
    }

    // Add entities folder and ensure it's visible
    console.log('🗄️  Processing entities from source_code...');
    const entityFiles = allFiles.filter(f => f.name && f.name.startsWith('entities/'));
    console.log('   Found entity files:', entityFiles.length, entityFiles.map(f => f.name));

    if (entityFiles.length > 0) {
      let entitiesFolder = tree.children.find(f => f.name === 'entities');
      if (!entitiesFolder) {
        console.log('   Creating entities folder');
        entitiesFolder = {
          name: 'entities',
          type: 'folder',
          path: '/entities',
          children: []
        };
        tree.children.push(entitiesFolder);
      }

      // Ensure entity files are in the folder with metadata
      entityFiles.forEach(entity => {
        const entityName = entity.name.replace('entities/', '');
        const entityPath = `/entities/${entityName}`;
        const existingIndex = entitiesFolder.children.findIndex(f => f.name === entityName);

        const entityFile = {
          name: entityName,
          type: 'file',
          path: entityPath,
          content: entity.code,
          entity_name: entity.entity_name,
          table_name: entity.table_name,
          migration_status: entity.migration_status
        };

        if (existingIndex >= 0) {
          entitiesFolder.children[existingIndex] = entityFile;
        } else {
          entitiesFolder.children.push(entityFile);
        }
      });
      console.log('   ✅ Added', entitiesFolder.children.length, 'entity files');
    }

    // Add controllers folder and ensure it's visible
    console.log('🎮 Processing controllers from source_code...');
    const controllerFiles = allFiles.filter(f => f.name && f.name.startsWith('controllers/'));
    console.log('   Found controller files:', controllerFiles.length, controllerFiles.map(f => f.name));

    if (controllerFiles.length > 0) {
      let controllersFolder = tree.children.find(f => f.name === 'controllers');
      if (!controllersFolder) {
        console.log('   Creating controllers folder');
        controllersFolder = {
          name: 'controllers',
          type: 'folder',
          path: '/controllers',
          children: []
        };
        tree.children.push(controllersFolder);
      }

      // Ensure controller files are in the folder with metadata
      controllerFiles.forEach(controller => {
        const controllerName = controller.name.replace('controllers/', '');
        const controllerPath = `/controllers/${controllerName}`;
        const existingIndex = controllersFolder.children.findIndex(f => f.name === controllerName);

        const controllerFile = {
          name: controllerName,
          type: 'file',
          path: controllerPath,
          content: controller.code,
          controller_name: controller.controller_name,
          method: controller.method,
          api_path: controller.path,
          description: controller.description,
          requires_auth: controller.requires_auth
        };

        if (existingIndex >= 0) {
          controllersFolder.children[existingIndex] = controllerFile;
        } else {
          controllersFolder.children.push(controllerFile);
        }
      });
      console.log('   ✅ Added', controllersFolder.children.length, 'controller files');
    }

    // Add migrations folder and ensure it's visible
    console.log('🔄 Processing migrations from source_code...');
    const migrationFiles = allFiles.filter(f => f.name && f.name.startsWith('migrations/'));
    console.log('   Found migration files:', migrationFiles.length, migrationFiles.map(f => f.name));

    if (migrationFiles.length > 0) {
      let migrationsFolder = tree.children.find(f => f.name === 'migrations');
      if (!migrationsFolder) {
        console.log('   Creating migrations folder');
        migrationsFolder = {
          name: 'migrations',
          type: 'folder',
          path: '/migrations',
          children: []
        };
        tree.children.push(migrationsFolder);
      }

      // Ensure migration files are in the folder with metadata
      migrationFiles.forEach(migration => {
        const migrationName = migration.name.replace('migrations/', '');
        const migrationPath = `/migrations/${migrationName}`;
        const existingIndex = migrationsFolder.children.findIndex(f => f.name === migrationName);

        const migrationFile = {
          name: migrationName,
          type: 'file',
          path: migrationPath,
          content: migration.code,
          migration_version: migration.migration_version,
          migration_description: migration.migration_description,
          migration_status: migration.migration_status,
          executed_at: migration.executed_at
        };

        if (existingIndex >= 0) {
          migrationsFolder.children[existingIndex] = migrationFile;
        } else {
          migrationsFolder.children.push(migrationFile);
        }
      });
      console.log('   ✅ Added', migrationsFolder.children.length, 'migration files');
    }

    // Add hardcoded files (manifest.json and README.md) at root level
    tree.children.push({
      name: 'manifest.json',
      type: 'file',
      path: '/manifest.json',
      content: JSON.stringify(pluginData.manifest || {}, null, 2)
    });

    tree.children.push({
      name: 'README.md',
      type: 'file',
      path: '/README.md',
      content: pluginData.readme || '# Plugin Documentation'
    });

    return [tree];
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

  const handleDeleteFile = async () => {
    if (!selectedFile) return;

    setShowDeleteConfirm(false);
    setIsDeleting(true);
    setShowTerminal(true);

    try {
      addTerminalOutput(`⏳ Deleting ${selectedFile.name}...`, 'info');

      // Delete file from backend
      await apiClient.delete(`plugins/registry/${plugin.id}/files`, {
        data: { path: selectedFile.path }
      });

      addTerminalOutput(`✓ Deleted ${selectedFile.name} successfully`, 'success');

      // Clear selection and reload
      setSelectedFile(null);
      setFileContent('');
      setOriginalContent('');
      await loadPluginFiles();

      setIsDeleting(false);

    } catch (error) {
      console.error('Error deleting file:', error);
      setIsDeleting(false);
      addTerminalOutput(`✗ Error deleting ${selectedFile.name}: ${error.response?.data?.error || error.message}`, 'error');
    }
  };

  const handleRunMigration = async () => {
    if (!selectedFile) return;

    setShowMigrationConfirm(false);
    setIsRunningMigration(true);
    setShowTerminal(true);

    const isMigrationFile = selectedFile.path.startsWith('/migrations/');
    const isEntityFile = selectedFile.path.startsWith('/entities/');

    try {
      if (isMigrationFile) {
        // Run existing migration
        addTerminalOutput(`⏳ Running migration: ${selectedFile.migration_version || selectedFile.name}...`, 'info');

        const response = await apiClient.post(`plugins/${plugin.id}/run-migration`, {
          migration_version: selectedFile.migration_version,
          migration_name: selectedFile.name
        });

        setMigrationResult(response.data);
        addTerminalOutput(`✓ Migration completed successfully in ${response.data.executionTime}ms`, 'success');

      } else if (isEntityFile) {
        // Generate pending migration for entity (don't execute yet)
        addTerminalOutput(`⏳ Generating migration for entity: ${selectedFile.entity_name}...`, 'info');

        const entityData = JSON.parse(fileContent);
        const isUpdate = selectedFile.migration_status === 'migrated';

        const response = await apiClient.post(`plugins/${plugin.id}/generate-entity-migration`, {
          entity_name: selectedFile.entity_name,
          table_name: selectedFile.table_name,
          schema_definition: entityData.schema_definition,
          is_update: isUpdate
        });

        setMigrationResult(response.data);
        addTerminalOutput(`✓ Migration generated: ${response.data.migrationVersion}`, 'success');
        addTerminalOutput(`  Status: pending (run from migrations folder)`, 'info');

        // Reload file tree to show new migration
        await loadPluginFiles();
      }

      setIsRunningMigration(false);

    } catch (error) {
      console.error('Error running migration:', error);
      setIsRunningMigration(false);
      setMigrationResult({
        success: false,
        error: error.response?.data?.error || error.message
      });
      addTerminalOutput(`✗ Migration failed: ${error.response?.data?.error || error.message}`, 'error');
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

    if (!editingFileName.trim()) {
      addTerminalOutput('✗ File name cannot be empty', 'error');
      setShowTerminal(true);
      return;
    }

    if (!selectedFile || !selectedFile.eventName) {
      addTerminalOutput('✗ No event file selected', 'error');
      setShowTerminal(true);
      return;
    }

    try {
      const filenameChanged = editingFileName !== selectedFile.name;
      const eventChanged = editingEventName !== selectedFile.eventName;

      if (filenameChanged && eventChanged) {
        addTerminalOutput(`⏳ Updating filename to ${editingFileName} and event to ${editingEventName}...`, 'info');
      } else if (filenameChanged) {
        addTerminalOutput(`⏳ Renaming file to ${editingFileName}...`, 'info');
      } else {
        addTerminalOutput(`⏳ Updating event mapping to ${editingEventName}...`, 'info');
      }

      setShowTerminal(true);

      // Create or update event listener mapping
      await apiClient.post(`plugins/${plugin.id}/event-listeners`, {
        file_name: editingFileName,  // New filename
        old_file_name: selectedFile.name,  // Old filename for lookup
        event_name: editingEventName,
        old_event_name: selectedFile.eventName,  // Send old event name for remapping
        listener_function: fileContent,
        priority: selectedFile.priority || 10,
        description: `Listens to ${editingEventName}`
      });

      if (filenameChanged && eventChanged) {
        addTerminalOutput(`✓ Updated filename and event mapping`, 'success');
      } else if (filenameChanged) {
        addTerminalOutput(`✓ File renamed to ${editingFileName}`, 'success');
      } else {
        addTerminalOutput(`✓ Event mapping updated to ${editingEventName}`, 'success');
      }

      // Close dialog and reset
      setShowEventMappingDialog(false);
      setEditingEventName('');
      setEditingFileName('');
      setEventSearchQuery('');

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
          minSize={4}
          maxSize={fileTreeMinimized ? 5 : 50}
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
                    <Badge className="bg-blue-100 text-blue-700 text-xs">
                      v{plugin.version}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowMigrationsPanel(!showMigrationsPanel)}
                      title="View migration status"
                      className="h-6 w-6 p-0 relative"
                    >
                      <Database className={`w-4 h-4 ${
                        allMigrations.some(m => m.status === 'pending')
                          ? 'text-orange-500'
                          : 'text-gray-700'
                      }`} />
                      {allMigrations.some(m => m.status === 'pending') && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full"></span>
                      )}
                    </Button>
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
                </div>
                {/* Migrations Status Panel */}
                {showMigrationsPanel && (
                  <div className="border-b bg-blue-50 p-3">
                    {/* Run All Pending Migrations Button */}
                    {allMigrations.some(m => m.status === 'pending') && (
                      <div className="mb-3">
                        <Button
                          size="sm"
                          className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                          onClick={() => {
                            // TODO: Implement run all pending migrations
                            addTerminalOutput('⏳ Running all pending migrations...', 'info');
                            setShowTerminal(true);
                          }}
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Run All Pending Migrations
                        </Button>
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                        <Database className="w-4 h-4" />
                        Migrations Status
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowMigrationsPanel(false)}
                        className="h-5 w-5 p-0"
                      >
                        ×
                      </Button>
                    </div>

                    {allMigrations.length === 0 ? (
                      <p className="text-xs text-gray-500 italic">No migrations found</p>
                    ) : (
                      <div className="space-y-1">
                        {allMigrations.map((migration, idx) => (
                          <div
                            key={idx}
                            className="bg-white p-2 rounded border text-xs"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-mono font-medium">{migration.version}</span>
                              <Badge className={
                                migration.status === 'completed'
                                  ? 'bg-green-100 text-green-700'
                                  : migration.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-red-100 text-red-700'
                              }>
                                {migration.status === 'completed' ? '✓' :
                                 migration.status === 'pending' ? '⏳' : '✗'}
                              </Badge>
                            </div>
                            {migration.description && (
                              <p className="text-gray-600 text-xs truncate">
                                {migration.description}
                              </p>
                            )}
                            {migration.executed_at && (
                              <p className="text-gray-400 text-xs mt-1">
                                {new Date(migration.executed_at).toLocaleString()}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-2 pt-2 border-t">
                      <p className="text-xs text-gray-600">
                        <span className="font-medium">Plugin Version:</span> {plugin.version}
                      </p>
                    </div>
                  </div>
                )}

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
              <div className="h-full flex pt-2 justify-center bg-gray-50" style={{ minWidth: '50px' }}>
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
          minSize={4}
          maxSize={editorMinimized ? 5 : 100}
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
                          <span className="font-medium" title={selectedFile.name}>
                            {selectedFile.name.length > 20
                              ? selectedFile.name.substring(0, 20) + '...'
                              : selectedFile.name}
                          </span>

                          {/* Migration Status Badge */}
                          {selectedFile?.migration_status && (
                            <Badge className={
                              selectedFile.migration_status === 'migrated'
                                ? 'bg-green-100 text-green-700 text-xs'
                                : selectedFile.migration_status === 'pending'
                                ? 'bg-yellow-100 text-yellow-700 text-xs'
                                : 'bg-red-100 text-red-700 text-xs'
                            }>
                              {selectedFile.migration_status === 'migrated' ? '✓ Migrated' :
                               selectedFile.migration_status === 'pending' ? '⏳ Pending' :
                               '✗ Failed'}
                            </Badge>
                          )}

                          {/* Modified Badge */}
                          {fileContent !== originalContent && (
                            <Badge className="bg-orange-100 text-orange-700 text-xs">
                              Modified
                            </Badge>
                          )}
                          {selectedFile.eventName && (
                            <Badge className="bg-purple-100 text-purple-700 text-xs">
                              {selectedFile.eventName}
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
                          setEditingFileName(selectedFile.name); // Set current filename
                          setEventSearchQuery(''); // Reset search when opening
                          setShowEventMappingDialog(true);
                        }}
                        title="Edit filename and event mapping"
                      >
                        <Zap className="w-4 h-4 mr-1" />
                        Edit Event
                      </Button>
                    )}

                    {/* Run Migration button - for migration files */}
                    {selectedFile?.path?.startsWith('/migrations/') && (
                      selectedFile?.migration_status === 'completed' ? (
                        <Badge className="bg-green-100 text-green-700 border-green-300 px-3 py-1">
                          ✓ Already Executed
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300"
                          onClick={() => setShowMigrationConfirm(true)}
                          disabled={isRunningMigration}
                          title="Execute this migration"
                        >
                          <Play className="w-4 h-4 mr-1" />
                          {isRunningMigration ? 'Running...' : 'Run Migration'}
                        </Button>
                      )
                    )}

                    {/* Generate Migration button - for entity files */}
                    {selectedFile?.path?.startsWith('/entities/') && (
                      selectedFile?.migration_status === 'migrated' && fileContent === originalContent ? (
                        <Badge className="bg-green-100 text-green-700 border-green-300 px-3 py-1">
                          ✓ Migrated
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className={
                            selectedFile?.migration_status === 'migrated'
                              ? 'bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-300'
                              : 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-300'
                          }
                          onClick={() => setShowMigrationConfirm(true)}
                          disabled={isRunningMigration}
                          title={
                            selectedFile?.migration_status === 'migrated'
                              ? 'Generate ALTER TABLE migration for updated schema'
                              : 'Generate CREATE TABLE migration for this entity'
                          }
                        >
                          <Wand2 className="w-4 h-4 mr-1" />
                          {isRunningMigration ? 'Generating...' :
                           selectedFile?.migration_status === 'migrated' ? 'Generate Update' : 'Generate Migration'}
                        </Button>
                      )
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
                      onClick={() => setShowDeleteConfirm(true)}
                      disabled={!selectedFile || isDeleting}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      title="Delete this file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
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
              <div className="h-full flex items-center justify-center bg-gray-50" style={{ minWidth: '50px' }}>
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
                  <EventSelector
                    searchQuery={eventSearchQuery}
                    onSearchChange={setEventSearchQuery}
                    selectedEvent={selectedEventName}
                    onSelectEvent={setSelectedEventName}
                    showConfirmation={true}
                  />
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
          <div className="bg-white rounded-lg shadow-xl p-6 w-96 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Edit Event File</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  File Name
                </label>
                <Input
                  value={editingFileName}
                  onChange={(e) => setEditingFileName(e.target.value)}
                  placeholder="e.g., my-tracker.js"
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Custom filename for this event listener
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event to Listen To *
                </label>
                <EventSelector
                  searchQuery={eventSearchQuery}
                  onSearchChange={setEventSearchQuery}
                  selectedEvent={editingEventName}
                  onSelectEvent={setEditingEventName}
                  showConfirmation={true}
                />
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
                  setEditingFileName('');
                  setEventSearchQuery(''); // Reset search
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete File Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-96">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              Delete File
            </h3>

            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Are you sure you want to delete this file?
              </p>

              <div className="bg-gray-50 p-3 rounded border">
                <p className="text-xs font-medium text-gray-700 mb-1">File:</p>
                <p className="text-sm font-mono break-all">{selectedFile?.name}</p>
                {selectedFile?.path && (
                  <>
                    <p className="text-xs font-medium text-gray-700 mt-2 mb-1">Path:</p>
                    <p className="text-xs font-mono text-gray-600 break-all">{selectedFile.path}</p>
                  </>
                )}
              </div>

              <div className="bg-red-50 border border-red-200 p-3 rounded">
                <p className="text-xs text-red-800 font-medium">
                  ⚠️ This action cannot be undone!
                </p>
                <p className="text-xs text-red-700 mt-1">
                  The file will be permanently deleted from the plugin.
                </p>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button
                onClick={() => setShowDeleteConfirm(false)}
                variant="outline"
                className="flex-1"
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteFile}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                disabled={isDeleting}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Run Migration Confirmation Dialog */}
      {showMigrationConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-96">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              {selectedFile?.path?.startsWith('/migrations/') ? (
                <>
                  <Play className="w-5 h-5 text-blue-600" />
                  Run Migration
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5 text-purple-600" />
                  Generate Migration
                </>
              )}
            </h3>

            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                {selectedFile?.path?.startsWith('/migrations/')
                  ? `Are you sure you want to execute this migration? This will modify your database schema.`
                  : `This will generate a pending migration file. You can review and run it from the migrations folder.`}
              </p>

              <div className="bg-gray-50 p-3 rounded border">
                <p className="text-xs font-medium text-gray-700 mb-1">
                  {selectedFile?.path?.startsWith('/migrations/') ? 'Migration:' : 'Entity:'}
                </p>
                <p className="text-sm font-mono">
                  {selectedFile?.path?.startsWith('/migrations/')
                    ? selectedFile.migration_version || selectedFile.name
                    : selectedFile.entity_name || selectedFile.name}
                </p>
                {selectedFile?.table_name && (
                  <>
                    <p className="text-xs font-medium text-gray-700 mt-2 mb-1">Table:</p>
                    <p className="text-sm font-mono">{selectedFile.table_name}</p>
                  </>
                )}
              </div>

              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded">
                <p className="text-xs text-yellow-800">
                  ⚠️ This will modify your database schema. Make sure you have a backup.
                </p>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button
                onClick={() => setShowMigrationConfirm(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRunMigration}
                className={`flex-1 ${
                  selectedFile?.path?.startsWith('/migrations/')
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-purple-600 hover:bg-purple-700'
                } text-white`}
              >
                {selectedFile?.path?.startsWith('/migrations/') ? (
                  <>
                    <Play className="w-4 h-4 mr-1" />
                    Run Now
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-1" />
                    Generate
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Migration Result Dialog */}
      {migrationResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-96">
            <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${migrationResult.success ? 'text-green-600' : 'text-red-600'}`}>
              {migrationResult.success ? '✓' : '✗'} Migration {migrationResult.success ? 'Completed' : 'Failed'}
            </h3>

            <div className="space-y-4">
              {migrationResult.success ? (
                <>
                  <div className="bg-green-50 border border-green-200 p-3 rounded">
                    <p className="text-sm text-green-800">
                      Migration executed successfully!
                    </p>
                  </div>

                  {migrationResult.executionTime && (
                    <p className="text-xs text-gray-600">
                      Execution time: {migrationResult.executionTime}ms
                    </p>
                  )}

                  {migrationResult.migrationVersion && (
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-xs font-medium text-gray-700 mb-1">Migration Version:</p>
                      <p className="text-sm font-mono">{migrationResult.migrationVersion}</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-red-50 border border-red-200 p-3 rounded">
                  <p className="text-sm text-red-800 font-medium mb-2">Error:</p>
                  <p className="text-xs text-red-700 font-mono">
                    {migrationResult.error}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-6">
              <Button
                onClick={() => setMigrationResult(null)}
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeveloperPluginEditor;
