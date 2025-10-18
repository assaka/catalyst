// src/components/admin/plugins/PluginCodeEditorWrapper.jsx
import { useState, useEffect } from 'react';
import FileTreeNavigator from '@/components/editor/ai-context/FileTreeNavigator';
import CodeEditor from '@/components/editor/ai-context/CodeEditor';
import CatalystAIStudio from '@/components/admin/CatalystAIStudio';
import DiffPreviewSystem from '@/components/editor/ai-context/DiffPreviewSystem';
import FileTabs from './FileTabs';

export default function PluginCodeEditorWrapper({ plugin, onSave }) {
  const [openFiles, setOpenFiles] = useState([]);
  const [activeFile, setActiveFile] = useState(null);

  useEffect(() => {
    // Initialize with manifest.json
    if (plugin && openFiles.length === 0) {
      const manifestFile = {
        name: 'manifest.json',
        path: 'manifest.json',
        language: 'json',
        content: JSON.stringify(plugin.manifest, null, 2),
        original: JSON.stringify(plugin.manifest, null, 2)
      };
      setOpenFiles([manifestFile]);
      setActiveFile(manifestFile);
    }
  }, [plugin]);

  const adaptPluginFilesForTree = () => {
    if (!plugin) return null;

    const tree = {
      name: plugin.name,
      type: 'folder',
      children: []
    };

    // Hooks folder
    if (plugin.manifest?.hooks?.length > 0) {
      tree.children.push({
        name: 'hooks',
        type: 'folder',
        path: 'hooks',
        children: plugin.manifest.hooks.map((hook, i) => ({
          name: `${hook.name}.js`,
          type: 'file',
          path: `hooks/${hook.name}.js`,
          content: hook.code,
          metadata: hook
        }))
      });
    }

    // Events folder
    if (plugin.manifest?.events?.length > 0) {
      tree.children.push({
        name: 'events',
        type: 'folder',
        path: 'events',
        children: plugin.manifest.events.map((event, i) => ({
          name: `${event.name}.js`,
          type: 'file',
          path: `events/${event.name}.js`,
          content: event.code,
          metadata: event
        }))
      });
    }

    // Widgets folder
    if (plugin.manifest?.widgets?.length > 0) {
      tree.children.push({
        name: 'widgets',
        type: 'folder',
        path: 'widgets',
        children: plugin.manifest.widgets.map((widget, i) => ({
          name: `${widget.name}.jsx`,
          type: 'file',
          path: `widgets/${widget.name}.jsx`,
          content: widget.code,
          metadata: widget
        }))
      });
    }

    // Scripts folder
    if (plugin.manifest?.scripts?.length > 0) {
      tree.children.push({
        name: 'scripts',
        type: 'folder',
        path: 'scripts',
        children: plugin.manifest.scripts.map((script, i) => ({
          name: script.name,
          type: 'file',
          path: `scripts/${script.name}`,
          content: script.code,
          metadata: script
        }))
      });
    }

    // Admin folder
    if (plugin.manifest?.navigation?.length > 0) {
      tree.children.push({
        name: 'admin',
        type: 'folder',
        path: 'admin',
        children: [
          {
            name: 'navigation.json',
            type: 'file',
            path: 'admin/navigation.json',
            content: JSON.stringify(plugin.manifest.navigation, null, 2)
          }
        ]
      });
    }

    // Manifest
    tree.children.push({
      name: 'manifest.json',
      type: 'file',
      path: 'manifest.json',
      content: JSON.stringify(plugin.manifest, null, 2)
    });

    return tree;
  };

  const handleFileSelect = (file) => {
    if (file.type !== 'file') return;

    // Check if already open
    const existing = openFiles.find(f => f.path === file.path);
    if (existing) {
      setActiveFile(existing);
      return;
    }

    // Open new file
    const newFile = {
      name: file.name,
      path: file.path,
      language: file.name.endsWith('.json') ? 'json' :
                file.name.endsWith('.jsx') ? 'javascript' : 'javascript',
      content: file.content || '',
      original: file.content || '',
      metadata: file.metadata
    };

    setOpenFiles(prev => [...prev, newFile]);
    setActiveFile(newFile);
  };

  const handleCodeChange = (newCode) => {
    if (!activeFile) return;

    setActiveFile(prev => ({ ...prev, content: newCode }));
    setOpenFiles(prev => prev.map(f =>
      f.path === activeFile.path ? { ...f, content: newCode } : f
    ));
  };

  const handleTabClose = (file) => {
    setOpenFiles(prev => prev.filter(f => f.path !== file.path));

    if (activeFile?.path === file.path) {
      const remaining = openFiles.filter(f => f.path !== file.path);
      setActiveFile(remaining[remaining.length - 1] || null);
    }
  };

  const handleSave = () => {
    // Collect all changes
    const updatedPlugin = { ...plugin };

    openFiles.forEach(file => {
      if (file.path.startsWith('hooks/')) {
        const hookName = file.path.replace('hooks/', '').replace('.js', '');
        const hookIndex = updatedPlugin.manifest.hooks.findIndex(h => h.name === hookName);
        if (hookIndex >= 0) {
          updatedPlugin.manifest.hooks[hookIndex].code = file.content;
        }
      } else if (file.path.startsWith('events/')) {
        const eventName = file.path.replace('events/', '').replace('.js', '');
        const eventIndex = updatedPlugin.manifest.events.findIndex(e => e.name === eventName);
        if (eventIndex >= 0) {
          updatedPlugin.manifest.events[eventIndex].code = file.content;
        }
      } else if (file.path.startsWith('widgets/')) {
        const widgetName = file.path.replace('widgets/', '').replace('.jsx', '');
        const widgetIndex = updatedPlugin.manifest.widgets.findIndex(w => w.name === widgetName);
        if (widgetIndex >= 0) {
          updatedPlugin.manifest.widgets[widgetIndex].code = file.content;
        }
      } else if (file.path === 'manifest.json') {
        try {
          updatedPlugin.manifest = JSON.parse(file.content);
        } catch (error) {
          console.error('Invalid manifest JSON');
        }
      }
    });

    onSave(updatedPlugin);
  };

  return (
    <div className="h-full flex bg-background">
      {/* LEFT: File Tree */}
      <div className="w-64 border-r">
        <FileTreeNavigator
          files={adaptPluginFilesForTree()}
          onFileSelect={handleFileSelect}
          selectedFile={activeFile}
          showDetails={false}
        />
      </div>

      {/* CENTER: Code Editor */}
      <div className="flex-1 flex flex-col">
        {/* File Tabs */}
        <FileTabs
          openFiles={openFiles}
          activeFile={activeFile}
          onSwitch={setActiveFile}
          onClose={handleTabClose}
        />

        {/* Editor */}
        {activeFile ? (
          <>
            <CodeEditor
              value={activeFile.content}
              onChange={handleCodeChange}
              language={activeFile.language}
              fileName={activeFile.name}
              enableDiffDetection={true}
              originalCode={activeFile.original}
            />

            {activeFile.content !== activeFile.original && (
              <DiffPreviewSystem
                originalCode={activeFile.original}
                modifiedCode={activeFile.content}
                fileName={activeFile.name}
                onPublish={handleSave}
              />
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Select a file to edit
          </div>
        )}
      </div>

      {/* RIGHT: AI Assistant */}
      <CatalystAIStudio initialContext="plugins" />
    </div>
  );
}
