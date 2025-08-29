import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Editor from '@monaco-editor/react';
import { 
  Save, 
  Undo, 
  Redo, 
  Search, 
  Maximize2,
  Minimize2,
  Code,
  Diff,
  Eye
} from 'lucide-react';

// Import diff service
import UnifiedDiffFrontendService from '../../services/unified-diff-frontend-service';

const CodeEditor = ({ 
  value = '', 
  onChange, 
  language = 'javascript',
  fileName = '',
  className = '',
  readOnly = false,
  onCursorPositionChange,
  onSelectionChange,
  onManualEdit,
  enableDiffDetection = false,
  initialContent = '',
  originalCode = ''
}) => {
  const [localCode, setLocalCode] = useState(value);
  const [isModified, setIsModified] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
  const [diffData, setDiffData] = useState(null);

  const editorRef = useRef(null);
  const diffServiceRef = useRef(new UnifiedDiffFrontendService());

  useEffect(() => {
    setLocalCode(value);
    setIsModified(false);
  }, [value]);

  // Generate diff when content changes
  useEffect(() => {
    if (enableDiffDetection && initialContent) {
      const contentToCompare = initialContent || originalCode || '';
      if (localCode !== contentToCompare) {
        const diffResult = diffServiceRef.current.createDiff(contentToCompare, localCode);
        // Use parsedDiff for component compatibility with pure line-based format
        if (diffResult.success) {
          setDiffData({
            ...diffResult,
            diff: diffResult.parsedDiff // Map parsedDiff to expected diff property
          });
        } else {
          setDiffData(diffResult);
        }
      } else {
        setDiffData(null);
      }
    }
  }, [localCode, initialContent, originalCode, enableDiffDetection]);


  const handleCodeChange = (newCode) => {
    setLocalCode(newCode);
    setIsModified(newCode !== value);
    
    // Detect if this was a manual edit (not from undo/redo)
    if (onManualEdit && newCode !== value) {
      onManualEdit(newCode, value, { enableDiffDetection });
    }
    
    onChange && onChange(newCode);
  };

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    
    // Set up cursor position tracking
    editor.onDidChangeCursorPosition((e) => {
      const position = { line: e.position.lineNumber, column: e.position.column };
      setCursorPosition(position);
      if (onCursorPositionChange) {
        onCursorPositionChange(position);
      }
    });
    
    // Set up selection change tracking
    editor.onDidChangeCursorSelection((e) => {
      if (onSelectionChange) {
        onSelectionChange({
          startLine: e.selection.startLineNumber,
          startColumn: e.selection.startColumn,
          endLine: e.selection.endLineNumber,
          endColumn: e.selection.endColumn
        });
      }
    });
  };

  const handleSave = () => {
    if (isModified && onChange) {
      onChange(localCode);
      setIsModified(false);
    }
  };

  const handleSearch = () => {
    if (editorRef.current) {
      editorRef.current.getAction('actions.find').run();
    }
  };

  const handleReplace = () => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.startFindReplaceAction').run();
    }
  };

  // Language detection based on filename extension
  const getMonacoLanguage = () => {
    if (!fileName) return language;
    
    const extension = fileName.split('.').pop()?.toLowerCase();
    const languageMap = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'json': 'json',
      'css': 'css',
      'scss': 'scss',
      'less': 'less',
      'html': 'html',
      'xml': 'xml',
      'md': 'markdown',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c'
    };
    
    return languageMap[extension] || language || 'javascript';
  };

  const getLanguageIcon = () => {
    switch (language) {
      case 'javascript':
      case 'jsx':
        return '📄';
      case 'typescript':
      case 'tsx':
        return '📘';
      case 'css':
        return '🎨';
      case 'html':
        return '🌐';
      case 'json':
        return '📋';
      default:
        return '📄';
    }
  };

  const handleUndo = () => {
    if (editorRef.current) {
      editorRef.current.getAction('undo').run();
    }
  };

  const handleRedo = () => {
    if (editorRef.current) {
      editorRef.current.getAction('redo').run();
    }
  };

  return (
    <div className={`h-full flex flex-col bg-background ${className} ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Header */}
      <div className="border-b p-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-lg">{getLanguageIcon()}</span>
            <span className="font-medium">{fileName || 'Untitled'}</span>
            {isModified && <Badge variant="outline" className="text-xs">Modified</Badge>}
            <Badge variant="secondary" className="text-xs">{language}</Badge>
          </div>

          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUndo}
              disabled={readOnly}
            >
              <Undo className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleRedo}
              disabled={readOnly}
            >
              <Redo className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleSearch}
              title="Search (Ctrl+F)"
            >
              <Search className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleSave}
              disabled={!isModified || readOnly}
            >
              <Save className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1">
        <Editor
          height="100%"
          language={getMonacoLanguage()}
          value={localCode}
          onChange={handleCodeChange}
          onMount={handleEditorDidMount}
          options={{
            readOnly: readOnly,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 14,
            lineHeight: 20,
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
            tabSize: 2,
            insertSpaces: true,
            wordWrap: 'on',
            automaticLayout: true,
            lineNumbers: 'on',
            glyphMargin: false,
            folding: true,
            lineDecorationsWidth: 0,
            lineNumbersMinChars: 4,
            renderLineHighlight: 'line',
            selectionHighlight: true,
            bracketPairColorization: { enabled: true },
            guides: { indentation: true },
            suggest: { showWords: false },
            quickSuggestions: {
              other: true,
              comments: false,
              strings: false
            }
          }}
          theme="vs-dark"
          loading={
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-muted-foreground">
                <Code className="w-8 h-8 mx-auto mb-2 animate-pulse" />
                <p>Loading editor...</p>
              </div>
            </div>
          }
        />
      </div>

      {/* Status Bar */}
      <div className="border-t px-4 py-1 bg-muted/50 text-xs text-muted-foreground">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span>Line {cursorPosition.line}, Column {cursorPosition.column}</span>
            <span>{localCode.length} characters</span>
            <span>{localCode.split('\n').length} lines</span>
          </div>

          <div className="flex items-center space-x-2">
            {isModified && <span className="text-orange-600">Unsaved changes</span>}
            <span>{getMonacoLanguage().toUpperCase()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;