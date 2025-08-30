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
  Eye,
  RotateCcw,
  Plus,
  Minus
} from 'lucide-react';

// Import diff service
import UnifiedDiffFrontendService from '../../services/unified-diff-frontend-service';

// DiffLine component for displaying individual diff lines
const DiffLine = ({ line, index, onLineRevert }) => {
  const getLineStyle = () => {
    switch (line.type) {
      case 'addition':
        return 'bg-green-50 border-l-4 border-l-green-500';
      case 'deletion':
        return 'bg-red-50 border-l-4 border-l-red-500';
      case 'context':
        return 'bg-background';
      default:
        return 'bg-background';
    }
  };

  const getLinePrefix = () => {
    switch (line.type) {
      case 'addition':
        return '+';
      case 'deletion':
        return '-';
      case 'context':
        return ' ';
      default:
        return ' ';
    }
  };

  const getLineNumbers = () => {
    const oldNum = line.lineNumber || '';
    const newNum = line.newLineNumber || '';
    return { oldNum, newNum };
  };

  const { oldNum, newNum } = getLineNumbers();
  
  const canRevert = onLineRevert && (line.type === 'addition' || line.type === 'deletion');
  const lineIndex = line.type === 'addition' ? (line.newLineNumber ? line.newLineNumber - 1 : null) : 
                   line.type === 'deletion' ? (line.lineNumber ? line.lineNumber - 1 : null) : null;

  const getLineIcon = () => {
    switch (line.type) {
      case 'addition':
        return <Plus className="w-3 h-3 text-green-600" />;
      case 'deletion':
        return <Minus className="w-3 h-3 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <div className={`flex items-start text-sm font-mono leading-5 ${getLineStyle()} group`}>
      {/* Revert button - show on hover for addition/deletion lines */}
      {canRevert && lineIndex !== null ? (
        <Button
          variant="ghost"
          size="sm"
          className="w-8 h-8 p-0 mr-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            onLineRevert(lineIndex, line.originalContent || '');
          }}
          title={`Revert this ${line.type} line`}
        >
          <RotateCcw className="w-3 h-3" />
        </Button>
      ) : (
        <div className="w-8 mr-1 flex-shrink-0" />
      )}

      {/* Line numbers */}
      <div className="flex-none flex">
        <div className="w-12 text-right text-muted-foreground px-2 py-1 select-none">
          {oldNum}
        </div>
        <div className="w-12 text-right text-muted-foreground px-2 py-1 select-none border-r">
          {newNum}
        </div>
      </div>
      
      {/* Line prefix and content with icon */}
      <div className="flex-1 flex">
        <div className="w-6 text-center py-1 select-none flex items-center justify-center">
          {getLineIcon() || <span className="text-muted-foreground">{getLinePrefix()}</span>}
        </div>
        <div className="flex-1 py-1 px-2 whitespace-pre-wrap break-all">
          {line.content || ''}
        </div>
      </div>
    </div>
  );
};

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
  const [showDiffView, setShowDiffView] = useState(false);
  const [fullFileDisplayLines, setFullFileDisplayLines] = useState([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const editorRef = useRef(null);
  const diffServiceRef = useRef(new UnifiedDiffFrontendService());

  useEffect(() => {
    setLocalCode(value);
    setIsModified(false);
  }, [value]);

  // Generate full file display lines with changes highlighted
  const generateFullFileDisplayLines = useCallback((parsedDiff, originalContent, modifiedContent) => {
    console.log('✨ [CodeEditor] generateFullFileDisplayLines starting:', {
      hasOriginal: !!originalContent,
      hasModified: !!modifiedContent,
      parsedDiffHunks: parsedDiff?.length || 0
    });

    if (!originalContent || !modifiedContent || !parsedDiff || parsedDiff.length === 0) {
      return [];
    }

    const originalLines = originalContent.split('\n');
    const modifiedLines = modifiedContent.split('\n');
    const displayLines = [];
    
    // Build a comprehensive change tracking system
    const changeRanges = [];
    
    // Extract all change ranges from hunks with correct line mapping
    parsedDiff.forEach(hunk => {
      const range = {
        oldStart: hunk.oldStart - 1, // Convert to 0-indexed
        oldEnd: hunk.oldStart - 1 + (hunk.oldLength || 0),
        newStart: hunk.newStart - 1, // Convert to 0-indexed  
        newEnd: hunk.newStart - 1 + (hunk.newLength || 0),
        changes: []
      };
      
      let oldLineOffset = hunk.oldStart - 1; // 0-indexed
      let newLineOffset = hunk.newStart - 1; // 0-indexed
      
      hunk.changes.forEach(change => {
        switch (change.type) {
          case 'delete':
            range.changes.push({
              type: 'deletion',
              oldLineNumber: oldLineOffset + 1, // Convert back to 1-indexed for display
              newLineNumber: null,
              content: change.content
            });
            oldLineOffset++;
            break;
          case 'add':
            range.changes.push({
              type: 'addition',
              oldLineNumber: null,
              newLineNumber: newLineOffset + 1, // Convert back to 1-indexed for display
              content: change.content
            });
            newLineOffset++;
            break;
          case 'context':
            range.changes.push({
              type: 'context',
              oldLineNumber: oldLineOffset + 1,
              newLineNumber: newLineOffset + 1,
              content: change.content
            });
            oldLineOffset++;
            newLineOffset++;
            break;
        }
      });
      
      changeRanges.push(range);
    });

    // Sort change ranges by position
    changeRanges.sort((a, b) => a.oldStart - b.oldStart);
    
    // Generate display lines with proper positioning
    let currentOldLine = 0; // 0-indexed
    let currentNewLine = 0; // 0-indexed
    let displayOldLineNumber = 1; // 1-indexed for display
    let displayNewLineNumber = 1; // 1-indexed for display
    
    for (const range of changeRanges) {
      // Add context lines before this change range
      while (currentOldLine < range.oldStart && currentNewLine < range.newStart) {
        const originalLine = originalLines[currentOldLine];
        const modifiedLine = modifiedLines[currentNewLine];
        
        if (originalLine !== undefined && modifiedLine !== undefined) {
          displayLines.push({
            type: 'context',
            lineNumber: displayOldLineNumber,
            newLineNumber: displayNewLineNumber,
            content: originalLine,
            originalContent: originalLine,
            modifiedContent: modifiedLine
          });
        }
        
        currentOldLine++;
        currentNewLine++;
        displayOldLineNumber++;
        displayNewLineNumber++;
      }
      
      // Add changes from the current range
      for (const change of range.changes) {
        displayLines.push({
          type: change.type,
          lineNumber: change.oldLineNumber,
          newLineNumber: change.newLineNumber,
          content: change.content,
          originalContent: change.type === 'deletion' || change.type === 'context' ? change.content : null,
          modifiedContent: change.type === 'addition' || change.type === 'context' ? change.content : null
        });
        
        // Update line counters based on change type
        if (change.type === 'deletion' || change.type === 'context') {
          currentOldLine++;
          displayOldLineNumber++;
        }
        if (change.type === 'addition' || change.type === 'context') {
          currentNewLine++;
          displayNewLineNumber++;
        }
      }
    }
    
    // Add remaining context lines after all changes
    while (currentOldLine < originalLines.length || currentNewLine < modifiedLines.length) {
      const originalLine = originalLines[currentOldLine];
      const modifiedLine = modifiedLines[currentNewLine];
      
      if (originalLine !== undefined || modifiedLine !== undefined) {
        if (originalLine !== undefined && modifiedLine !== undefined && originalLine === modifiedLine) {
          // Context line
          displayLines.push({
            type: 'context',
            lineNumber: displayOldLineNumber,
            newLineNumber: displayNewLineNumber,
            content: originalLine,
            originalContent: originalLine,
            modifiedContent: modifiedLine
          });
          currentOldLine++;
          currentNewLine++;
          displayOldLineNumber++;
          displayNewLineNumber++;
        } else {
          // Handle remaining deletions/additions
          if (originalLine !== undefined && (modifiedLine === undefined || originalLine !== modifiedLine)) {
            displayLines.push({
              type: 'deletion',
              lineNumber: displayOldLineNumber,
              newLineNumber: null,
              content: originalLine,
              originalContent: originalLine,
              modifiedContent: null
            });
            currentOldLine++;
            displayOldLineNumber++;
          }
          if (modifiedLine !== undefined && (originalLine === undefined || originalLine !== modifiedLine)) {
            displayLines.push({
              type: 'addition',
              lineNumber: null,
              newLineNumber: displayNewLineNumber,
              content: modifiedLine,
              originalContent: null,
              modifiedContent: modifiedLine
            });
            currentNewLine++;
            displayNewLineNumber++;
          }
        }
      } else {
        break;
      }
    }
    
    console.log('✅ [CodeEditor] generateFullFileDisplayLines completed:', {
      totalLines: displayLines.length,
      additions: displayLines.filter(line => line.type === 'addition').length,
      deletions: displayLines.filter(line => line.type === 'deletion').length,
      context: displayLines.filter(line => line.type === 'context').length,
      changeRangesProcessed: changeRanges.length
    });
    
    return displayLines;
  }, []);

  // Handle line revert functionality
  const handleLineRevert = useCallback(async (lineIndex, originalLine) => {
    console.log('🔄 [CodeEditor] Reverting line', lineIndex, 'to original:', originalLine);
    
    const currentLines = localCode.split('\n');
    
    // Revert the specific line to its original content
    if (lineIndex < currentLines.length) {
      currentLines[lineIndex] = originalLine;
      const newCode = currentLines.join('\n');
      
      console.log('🔄 [CodeEditor] New code after revert has', newCode.split('\n').length, 'lines');
      
      setLocalCode(newCode);
      setIsModified(true);
      
      // Call onChange if provided
      if (onChange) {
        onChange(newCode);
      }
      
      // Regenerate diff data
      if (enableDiffDetection && originalCode) {
        const diffResult = diffServiceRef.current.createDiff(originalCode, newCode);
        if (diffResult) {
          setDiffData(diffResult);
          const displayLines = generateFullFileDisplayLines(diffResult.parsedDiff, originalCode, newCode);
          setFullFileDisplayLines(displayLines);
        }
      }
    }
  }, [localCode, originalCode, onChange, enableDiffDetection, generateFullFileDisplayLines]);

  // Generate diff when content changes
  useEffect(() => {
    if (enableDiffDetection && initialContent) {
      const contentToCompare = initialContent || originalCode || '';
      if (localCode !== contentToCompare) {
        const diffResult = diffServiceRef.current.createDiff(contentToCompare, localCode);
        
        if (diffResult.success) {
          // Generate full file display lines for rich diff view
          const displayLines = generateFullFileDisplayLines(
            diffResult.parsedDiff, 
            contentToCompare, 
            localCode
          );
          
          setDiffData({
            ...diffResult,
            diff: diffResult.parsedDiff // Map parsedDiff to expected diff property
          });
          setFullFileDisplayLines(displayLines);
        } else {
          setDiffData(diffResult);
          setFullFileDisplayLines([]);
        }
      } else {
        setDiffData(null);
        setFullFileDisplayLines([]);
      }
    }
  }, [localCode, initialContent, originalCode, enableDiffDetection, generateFullFileDisplayLines]);


  const handleCodeChange = (newCode) => {
    setLocalCode(newCode);
    setIsModified(newCode !== value);
    
    // Always call onManualEdit to let the parent handle change detection
    // The parent (AIContextWindow) will determine if there are real changes
    if (onManualEdit) {
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

            {enableDiffDetection && diffData && (
              <Button
                variant={showDiffView ? "default" : "ghost"}
                size="sm"
                onClick={() => setShowDiffView(!showDiffView)}
                title={showDiffView ? "Show Code Editor" : "Show Diff View"}
              >
                {showDiffView ? <Code className="w-4 h-4" /> : <Diff className="w-4 h-4" />}
              </Button>
            )}

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
        {showDiffView && enableDiffDetection && fullFileDisplayLines.length > 0 ? (
          /* Diff View */
          <div className="h-full overflow-auto border">
            <div className="min-w-max">
              {fullFileDisplayLines.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-muted-foreground">
                    <Diff className="w-8 h-8 mx-auto mb-2" />
                    <p>No differences to display</p>
                    <p className="text-sm mt-1">
                      The original and modified code are identical
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  {fullFileDisplayLines.map((line, index) => (
                    <DiffLine key={index} line={line} index={index} onLineRevert={handleLineRevert} />
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Monaco Editor */
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
        )}
      </div>

      {/* Status Bar */}
      <div className="border-t px-4 py-1 bg-muted/50 text-xs text-muted-foreground">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {showDiffView && diffData ? (
              <>
                <span>
                  +{diffData.metadata?.additions || 0} -{diffData.metadata?.deletions || 0}
                </span>
                <span>{fullFileDisplayLines.length} lines in diff</span>
              </>
            ) : (
              <>
                <span>Line {cursorPosition.line}, Column {cursorPosition.column}</span>
                <span>{localCode.length} characters</span>
                <span>{localCode.split('\n').length} lines</span>
              </>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {showDiffView && diffData && (
              <Badge variant="outline" className="text-xs">
                <Diff className="w-3 h-3 mr-1" />
                Diff View
              </Badge>
            )}
            {isModified && <span className="text-orange-600">Unsaved changes</span>}
            <span>{getMonacoLanguage().toUpperCase()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;