import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Code, Eye, Layout, Download, Save, Settings, Loader2, EyeOff } from 'lucide-react';

/**
 * EditorWrapper - Provides consistent mode switching and controls for all editors
 * @param {Object} props
 * @param {React.ReactNode} props.children - The editor content to wrap
 * @param {string} props.title - Title for the editor (e.g., "Cart Editor")
 * @param {Function} props.onSave - Save callback function
 * @param {string} props.saveStatus - Current save status ('saving', 'saved', 'error', '')
 * @param {boolean} props.isSidebarVisible - Whether sidebar is visible
 * @param {Function} props.onToggleSidebar - Callback to toggle sidebar visibility
 * @param {Function} props.onDownload - Optional download callback
 * @param {Object} props.additionalControls - Additional control buttons
 */
const EditorWrapper = ({
  children,
  title = "Editor",
  onSave,
  saveStatus = '',
  isSidebarVisible = false,
  onToggleSidebar,
  onDownload,
  additionalControls = null
}) => {
  const [editorMode, setEditorMode] = useState('layout');

  const handleModeChange = (mode) => {
    setEditorMode(mode);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Editor Header */}
      <div className="bg-white border-b px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          {/* Left side - Title and Mode Tabs */}
          <div className="flex items-center gap-6">
            <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
            
            {/* Mode Tabs */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => handleModeChange('layout')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                  editorMode === 'layout'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                }`}
              >
                <Layout className="w-4 h-4" />
                Layout
              </button>
              <button
                onClick={() => handleModeChange('preview')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                  editorMode === 'preview'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                }`}
              >
                <Eye className="w-4 h-4" />
                Preview
              </button>
              <button
                onClick={() => handleModeChange('code')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                  editorMode === 'code'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                }`}
              >
                <Code className="w-4 h-4" />
                Code
              </button>
            </div>
          </div>

          {/* Right side - Controls */}
          <div className="flex items-center gap-2">
            {/* Save Status */}
            {saveStatus && (
              <div className={`flex items-center gap-2 text-sm ${
                saveStatus === 'saving' ? 'text-blue-600' : 
                saveStatus === 'saved' ? 'text-green-600' : 
                'text-red-600'
              }`}>
                {saveStatus === 'saving' && <Loader2 className="w-4 h-4 animate-spin" />}
                {saveStatus === 'saved' && '✓ Saved'}
                {saveStatus === 'error' && '✗ Save Failed'}
              </div>
            )}

            {/* Additional Controls */}
            {additionalControls}

            {/* Download Button */}
            {onDownload && (
              <Button onClick={onDownload} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            )}

            {/* Save Button */}
            {onSave && (
              <Button 
                onClick={onSave} 
                disabled={saveStatus === 'saving'} 
                variant="outline" 
                size="sm"
              >
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
            )}

            {/* Sidebar Toggle */}
            {onToggleSidebar && (
              <Button onClick={onToggleSidebar} variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                {isSidebarVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-hidden">
        {React.isValidElement(children) 
          ? React.cloneElement(children, { mode: editorMode })
          : children
        }
      </div>
    </div>
  );
};

export default EditorWrapper;