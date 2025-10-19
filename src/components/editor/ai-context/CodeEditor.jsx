import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Editor from '@monaco-editor/react';
import { 
  Save, 
  Undo, 
  Redo, 
  Search, 
  Code,
  Diff,
  Eye,
  Split,
  RotateCcw,
  History,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  Plus,
  Minus,
  GitBranch,
  Clock,
  FileText,
  AlertTriangle,
  CheckCircle,
  Info,
  RefreshCw,
  Minimize2
} from 'lucide-react';

// Import new systems
import hookSystem from '@/core/HookSystem.js';
import eventSystem from '@/core/EventSystem.js';
import UnifiedDiffFrontendService from '@/services/unified-diff-frontend-service';


// RevertGutter component for split view
const RevertGutter = ({ changedBlocks, onRevertBlock, onRevertLine }) => {
  if (!changedBlocks || changedBlocks.length === 0) return null;
  
  return (
    <div className="absolute left-0 top-0 w-8 h-full pointer-events-none">
      {changedBlocks.map((block, blockIndex) => (
        <div
          key={blockIndex}
          className="absolute pointer-events-auto"
          style={{
            top: `${block.startLine * 20}px`, // Assuming 20px line height
            height: `${(block.endLine - block.startLine + 1) * 20}px`
          }}
        >
          <div className="w-full h-full bg-blue-500/5 border-l-2 border-blue-500/20">
            <Button
              variant="ghost"
              size="sm"
              className="absolute -left-1 top-0 w-6 h-6 p-0 bg-gray-400 hover:bg-gray-500 text-white transition-colors duration-150"
              onClick={() => {
                if (block.startLine === block.endLine) {
                  onRevertLine(block.startLine);
                } else {
                  onRevertBlock(block.startLine, block.endLine);
                }
              }}
              title={`Revert ${block.startLine === block.endLine ? 'line' : 'lines'} ${block.startLine + 1}${block.startLine !== block.endLine ? `-${block.endLine + 1}` : ''}`}
            >
              <ChevronLeft className="w-3 h-3" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

// DiffLine component for displaying individual diff lines
const DiffLine = ({ line, index }) => {
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

  return (
    <div className={`flex items-start text-sm font-mono leading-5 ${getLineStyle()}`}>
      {/* Line numbers */}
      <div className="flex-none flex">
        <div className="w-12 text-right text-muted-foreground px-2 py-1 select-none">
          {oldNum}
        </div>
        <div className="w-12 text-right text-muted-foreground px-2 py-1 select-none border-r">
          {newNum}
        </div>
      </div>
      
      {/* Line prefix and content */}
      <div className="flex-1 flex">
        <div className="w-4 text-center text-muted-foreground py-1 select-none">
          {getLinePrefix()}
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
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
  const [diffData, setDiffData] = useState(null);
  const [showDiffView, setShowDiffView] = useState(false);
  const [showSplitView, setShowSplitView] = useState(false);
  const [collapseUnchanged, setCollapseUnchanged] = useState(false);
  const [fullFileDisplayLines, setFullFileDisplayLines] = useState([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);

  const editorRef = useRef(null);
  const diffServiceRef = useRef(new UnifiedDiffFrontendService());
  
  // Helper function to get diff stats
  // Enhanced diff statistics
  const getDiffStats = useCallback((oldCode, newCode) => {
    if (!oldCode || !newCode) {
      return { additions: 0, deletions: 0, changes: 0, linesChanged: 0, unchanged: 0 };
    }

    // Normalize: trim trailing empty lines to avoid false positives
    const normalizeCode = (code) => {
      const lines = code.split('\n');
      // Remove trailing empty lines
      while (lines.length > 0 && lines[lines.length - 1].trim() === '') {
        lines.pop();
      }
      return lines;
    };

    const oldLines = normalizeCode(oldCode);
    const newLines = normalizeCode(newCode);

    let additions = 0;
    let deletions = 0;
    let linesChanged = 0;
    let unchanged = 0;

    const maxLines = Math.max(oldLines.length, newLines.length);

    for (let i = 0; i < maxLines; i++) {
      const oldLine = oldLines[i];
      const newLine = newLines[i];

      if (oldLine === undefined && newLine !== undefined) {
        additions++; // Line added
      } else if (oldLine !== undefined && newLine === undefined) {
        deletions++; // Line deleted
      } else if (oldLine !== newLine) {
        linesChanged++; // Line modified
      } else if (oldLine === newLine) {
        unchanged++; // Line unchanged
      }
    }

    return {
      additions,
      deletions,
      linesChanged,
      unchanged,
      changes: additions + deletions + linesChanged,
      totalLines: maxLines
    };
  }, []);
  
  // Helper function to process code for collapsed view
  const getCollapsedCode = useCallback((originalCode, modifiedCode) => {
    if (!collapseUnchanged || !originalCode || !modifiedCode) {
      console.log('⚠️ [Collapse] Not collapsing:', { collapseUnchanged, hasOriginal: !!originalCode, hasModified: !!modifiedCode });
      return { original: originalCode, modified: modifiedCode };
    }

    console.log('🔽 [Collapse] Starting collapse...');
    const originalLines = originalCode.split('\n');
    const modifiedLines = modifiedCode.split('\n');
    const maxLines = Math.max(originalLines.length, modifiedLines.length);

    const collapsedOriginal = [];
    const collapsedModified = [];
    const CONTEXT_LINES = 2; // Show 2 lines before and after changes
    const MIN_COLLAPSE = 5; // Only collapse if more than 5 unchanged lines

    // First pass: identify all changed line indices
    const changedIndices = [];
    for (let i = 0; i < maxLines; i++) {
      const origLine = originalLines[i] || '';
      const modLine = modifiedLines[i] || '';
      if (origLine !== modLine) {
        changedIndices.push(i);
      }
    }

    console.log('🔍 [Collapse] Found', changedIndices.length, 'changed lines');

    // If no changes, return original code
    if (changedIndices.length === 0) {
      return { original: originalCode, modified: modifiedCode };
    }

    // Second pass: determine which lines to show
    const linesToShow = new Set();

    // Add context around each changed line
    changedIndices.forEach(idx => {
      // Add the changed line itself
      linesToShow.add(idx);
      // Add CONTEXT_LINES before
      for (let i = Math.max(0, idx - CONTEXT_LINES); i < idx; i++) {
        linesToShow.add(i);
      }
      // Add CONTEXT_LINES after
      for (let i = idx + 1; i <= Math.min(maxLines - 1, idx + CONTEXT_LINES); i++) {
        linesToShow.add(i);
      }
    });

    console.log('📋 [Collapse] Showing', linesToShow.size, 'lines out of', maxLines);

    // Third pass: build collapsed output with placeholders
    const sortedLinesToShow = Array.from(linesToShow).sort((a, b) => a - b);
    let lastShownLine = -1;

    sortedLinesToShow.forEach((lineIdx, arrIdx) => {
      // Check if there's a gap between this line and the last shown line
      const gap = lineIdx - lastShownLine - 1;

      if (gap > 0) {
        if (gap >= MIN_COLLAPSE) {
          // Large gap - show collapse indicator
          collapsedOriginal.push(`... ${gap} unchanged lines ...`);
          collapsedModified.push(`... ${gap} unchanged lines ...`);
        } else {
          // Small gap - show all lines
          for (let i = lastShownLine + 1; i < lineIdx; i++) {
            collapsedOriginal.push(originalLines[i] || '');
            collapsedModified.push(modifiedLines[i] || '');
          }
        }
      }

      // Add the current line
      collapsedOriginal.push(originalLines[lineIdx] || '');
      collapsedModified.push(modifiedLines[lineIdx] || '');
      lastShownLine = lineIdx;
    });

    // Handle any remaining lines after the last shown line
    const remainingLines = maxLines - lastShownLine - 1;
    if (remainingLines > 0) {
      if (remainingLines >= MIN_COLLAPSE) {
        collapsedOriginal.push(`... ${remainingLines} unchanged lines ...`);
        collapsedModified.push(`... ${remainingLines} unchanged lines ...`);
      } else {
        for (let i = lastShownLine + 1; i < maxLines; i++) {
          collapsedOriginal.push(originalLines[i] || '');
          collapsedModified.push(modifiedLines[i] || '');
        }
      }
    }

    const result = {
      original: collapsedOriginal.join('\n'),
      modified: collapsedModified.join('\n')
    };

    console.log('✅ [Collapse] Collapsed to', collapsedOriginal.length, 'lines');
    return result;
  }, [collapseUnchanged]);
  
  // Version restoration removed for simplicity
  
  // Handle line-specific reverts
  const handleRevertLine = useCallback((lineIndex) => {
    if (!originalCode) return;
    
    const currentLines = localCode.split('\n');
    const originalLines = originalCode.split('\n');
    
    if (originalLines[lineIndex] !== undefined) {
      currentLines[lineIndex] = originalLines[lineIndex];
      const newCode = currentLines.join('\n');
      
      setLocalCode(newCode);
      
      // Apply hooks
      hookSystem.do('codeEditor.lineReverted', {
        fileName,
        lineIndex,
        originalLine: originalLines[lineIndex],
        newCode
      });
      
      // Check if all changes have been reverted, if so switch to Editor mode
      if (newCode === originalCode) {
        setShowSplitView(false);
        setShowDiffView(false);
        setShowPreviewFrame(false);
      }
      
      if (onChange) {
        onChange(newCode);
      }
    }
  }, [localCode, originalCode, fileName, onChange]);
  
  // Handle block-level reverts (for multiple consecutive lines)
  const handleRevertBlock = useCallback((startLine, endLine) => {
    if (!originalCode) return;
    
    const currentLines = localCode.split('\n');
    const originalLines = originalCode.split('\n');
    
    // Revert all lines in the block
    for (let i = startLine; i <= endLine; i++) {
      if (originalLines[i] !== undefined) {
        currentLines[i] = originalLines[i];
      }
    }
    
    const newCode = currentLines.join('\n');
    setLocalCode(newCode);
    
    // Apply hooks
    hookSystem.do('codeEditor.blockReverted', {
      fileName,
      startLine,
      endLine,
      newCode
    });
    
    // Check if all changes have been reverted, if so switch to Editor mode
    if (newCode === originalCode) {
      setShowSplitView(false);
      setShowDiffView(false);
      setShowPreviewFrame(false);
    }
    
    if (onChange) {
      onChange(newCode);
    }
  }, [localCode, originalCode, fileName, onChange]);
  
  // Get changed line blocks for revert functionality
  const getChangedBlocks = useCallback(() => {
    if (!originalCode || !localCode) return [];

    const originalLines = originalCode.split('\n');
    const modifiedLines = localCode.split('\n');
    const blocks = [];

    // Find the actual content length (excluding trailing empty lines)
    let maxContentLine = Math.max(originalLines.length, modifiedLines.length);
    while (maxContentLine > 0) {
      const origLine = originalLines[maxContentLine - 1] || '';
      const modLine = modifiedLines[maxContentLine - 1] || '';
      if (origLine.trim() !== '' || modLine.trim() !== '') break;
      maxContentLine--;
    }

    let currentBlock = null;

    for (let i = 0; i < maxContentLine; i++) {
      const original = originalLines[i] || '';
      const modified = modifiedLines[i] || '';

      if (original !== modified) {
        if (currentBlock && currentBlock.endLine === i - 1) {
          // Extend current block
          currentBlock.endLine = i;
          currentBlock.lines.push({
            lineIndex: i,
            originalLine: original,
            modifiedLine: modified,
            type: original === '' ? 'addition' : modified === '' ? 'deletion' : 'modification'
          });
        } else {
          // Start new block
          currentBlock = {
            startLine: i,
            endLine: i,
            lines: [{
              lineIndex: i,
              originalLine: original,
              modifiedLine: modified,
              type: original === '' ? 'addition' : modified === '' ? 'deletion' : 'modification'
            }]
          };
          blocks.push(currentBlock);
        }
      } else {
        currentBlock = null;
      }
    }

    return blocks;
  }, [originalCode, localCode]);

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
    const originalLines = (originalCode || '').split('\n');

    let newCode;

    // Check if this is an addition (line doesn't exist in original)
    if (lineIndex >= originalLines.length || originalLine === undefined || originalLine === null) {
      // This is an added line - remove it completely
      console.log('🔄 [CodeEditor] Removing added line', lineIndex);
      currentLines.splice(lineIndex, 1);
      newCode = currentLines.join('\n');
    } else {
      // This is a modified line - revert to original
      console.log('🔄 [CodeEditor] Reverting modified line', lineIndex, 'to:', originalLine);
      currentLines[lineIndex] = originalLine;
      newCode = currentLines.join('\n');
    }

    console.log('🔄 [CodeEditor] New code after revert has', newCode.split('\n').length, 'lines');

    setLocalCode(newCode);
    setIsModified(true);

    // Call onChange to trigger diff regeneration via useEffect
    if (onChange) {
      onChange(newCode);
    }

    // Note: Don't manually regenerate diff here - let the useEffect handle it
    // to avoid race conditions and ensure proper diff generation
  }, [localCode, originalCode, onChange]);

  // Generate diff when content changes
  useEffect(() => {
    if (enableDiffDetection && (initialContent || originalCode)) {
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

  // Cleanup effect for Monaco Editor
  useEffect(() => {
    return () => {
      // Cleanup Monaco editor on unmount
      if (editorRef.current) {
        // Dispose of event listeners
        if (editorRef.current._disposables) {
          editorRef.current._disposables.forEach(d => d?.dispose?.());
        }
        // Clear the editor reference
        editorRef.current = null;
      }
    };
  }, []);

  const handleCodeChange = (newCode) => {
    // Apply hooks before processing change
    const processedCode = hookSystem.apply('codeEditor.beforeChange', newCode, {
      fileName,
      language,
      originalCode: value
    });
    
    setLocalCode(processedCode);
    setIsModified(processedCode !== value);
    
    // Emit event for extensions
    eventSystem.emit('codeEditor.codeChanged', {
      fileName,
      oldCode: value,
      newCode: processedCode,
      language
    });
    
    // Version history removed for simplicity
    
    // Always call onManualEdit to let the parent handle change detection
    if (onManualEdit) {
      onManualEdit(processedCode, value, { enableDiffDetection });
    }
    
    onChange && onChange(processedCode);
    
    // Update undo/redo button states
    setTimeout(() => {
      if (editorRef.current) {
        try {
          const model = editorRef.current.getModel();
          if (model && model.canUndo && model.canRedo) {
            setCanUndo(model.canUndo());
            setCanRedo(model.canRedo());
          } else {
            setCanUndo(true);
            setCanRedo(false);
          }
        } catch (error) {
          console.warn('Could not update undo/redo state:', error);
          setCanUndo(true);
          setCanRedo(true);
        }
      }
    }, 100);
  };

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;

    // Store disposables for cleanup
    const disposables = [];

    // Set up undo/redo state tracking
    const updateUndoRedoState = () => {
      const model = editor.getModel();
      if (model) {
        setCanUndo(model.canUndo());
        setCanRedo(model.canRedo());
      }
    };

    // Track content changes for undo/redo states
    const contentDisposable = editor.onDidChangeModelContent(() => {
      updateUndoRedoState();
    });
    disposables.push(contentDisposable);

    // Set up cursor position tracking
    const cursorDisposable = editor.onDidChangeCursorPosition((e) => {
      const position = { line: e.position.lineNumber, column: e.position.column };
      setCursorPosition(position);
      if (onCursorPositionChange) {
        onCursorPositionChange(position);
      }
    });
    disposables.push(cursorDisposable);

    // Set up selection change tracking
    const selectionDisposable = editor.onDidChangeCursorSelection((e) => {
      if (onSelectionChange) {
        onSelectionChange({
          startLine: e.selection.startLineNumber,
          startColumn: e.selection.startColumn,
          endLine: e.selection.endLineNumber,
          endColumn: e.selection.endColumn
        });
      }
    });
    disposables.push(selectionDisposable);

    // Store disposables for cleanup
    editorRef.current._disposables = disposables;

    // Initial undo/redo state
    updateUndoRedoState();
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
      try {
        editorRef.current.trigger('keyboard', 'undo');

        // Update local state and call onChange
        const newValue = editorRef.current.getValue();
        setLocalCode(newValue);
        setIsModified(newValue !== value);

        if (onChange) {
          onChange(newValue);
        }

        // Update button states
        setTimeout(() => {
          try {
            const model = editorRef.current.getModel();
            if (model) {
              setCanUndo(model.canUndo());
              setCanRedo(model.canRedo());
            }
          } catch (error) {
            console.warn('Could not update undo/redo state:', error);
          }
        }, 100);

      } catch (error) {
        console.error('❌ [CodeEditor] Error during undo operation:', error);
      }
    }
  };

  const handleRedo = () => {
    if (editorRef.current) {
      try {
        editorRef.current.trigger('keyboard', 'redo');

        // Update local state and call onChange
        const newValue = editorRef.current.getValue();
        setLocalCode(newValue);
        setIsModified(newValue !== value);

        if (onChange) {
          onChange(newValue);
        }

        // Update button states
        setTimeout(() => {
          try {
            const model = editorRef.current.getModel();
            if (model) {
              setCanUndo(model.canUndo());
              setCanRedo(model.canRedo());
            }
          } catch (error) {
            console.warn('Could not update undo/redo state:', error);
          }
        }, 100);

      } catch (error) {
        console.error('❌ [CodeEditor] Error during redo operation:', error);
      }
    }
  };

  return (
    <div className={`h-full flex flex-col bg-background ${className}`}>
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
              disabled={readOnly || !canUndo}
              title={canUndo ? "Undo (Ctrl+Z) - Creates reverse patch" : "Nothing to undo"}
              className={canUndo ? "hover:bg-blue-50 hover:text-blue-600" : ""}
            >
              <Undo className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleRedo}
              disabled={readOnly || !canRedo}
              title={canRedo ? "Redo (Ctrl+Y) - Creates forward patch" : "Nothing to redo"}
              className={canRedo ? "hover:bg-blue-50 hover:text-blue-600" : ""}
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
              onClick={() => setShowRestoreModal(true)}
              disabled={!originalCode && !initialContent}
              title="Restore to original content"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            
            {enableDiffDetection && diffData && (
              <>
                <Button
                  variant={!showSplitView && !showDiffView ? "default" : "ghost"}
                  size="sm"
                  onClick={() => {
                    setShowSplitView(false);
                    setShowDiffView(false);
                  }}
                  title="Show Code Editor"
                >
                  <Code className="w-4 h-4" />
                </Button>

                <Button
                  variant={showSplitView ? "default" : "ghost"}
                  size="sm"
                  onClick={() => {
                    setShowSplitView(true);
                    setShowDiffView(false);
                  }}
                  title="Show Split View"
                >
                  <Split className="w-4 h-4" />
                </Button>
                
                {showSplitView && (
                  <Button
                    variant={collapseUnchanged ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setCollapseUnchanged(!collapseUnchanged)}
                    title={collapseUnchanged ? "Show All Lines" : "Collapse Unchanged Lines"}
                    className="px-2"
                  >
                    {collapseUnchanged ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  </Button>
                )}
                
                <Button
                  variant={showDiffView ? "default" : "ghost"}
                  size="sm"
                  onClick={() => {
                    setShowDiffView(true);
                    setShowSplitView(false);
                  }}
                  title="Show Diff View"
                >
                  <Diff className="w-4 h-4" />
                </Button>
              </>
            )}

          </div>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1">
        {showSplitView && enableDiffDetection ? (
          /* Split View - Original vs Modified */
          (() => {
            const { original: collapsedOriginal, modified: collapsedModified } = getCollapsedCode(originalCode, localCode);
            return (
              <div className="h-full flex">
                {/* Original Code */}
                <div className="flex-1 border-r">
                  <div className="bg-muted p-2 text-sm font-medium border-b flex items-center justify-between">
                    <span>Original ({originalCode?.split('\n').length || 0} lines)</span>
                    {collapseUnchanged && (
                      <Badge variant="secondary" className="text-xs">
                        <ChevronUp className="w-3 h-3 mr-1" />
                        Collapsed
                      </Badge>
                    )}
                  </div>
                  <Editor
                    height="100%"
                    language={getMonacoLanguage()}
                    value={collapsedOriginal || originalCode || ''}
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  fontSize: 14,
                  lineHeight: 20,
                  fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
                  tabSize: 2,
                  wordWrap: 'on',
                  automaticLayout: true,
                  lineNumbers: 'on',
                  glyphMargin: true,
                  folding: true
                }}
                theme="vs-dark"
              />
            </div>
            
                {/* Modified Code with Revert Gutter */}
                <div className="flex-1 flex">
                  {/* Revert Gutter Column - Syncs scroll with Monaco */}
                  {!collapseUnchanged && (() => {
                    const changedBlocks = getChangedBlocks();
                    if (changedBlocks.length === 0) return null;

                    const totalLines = localCode.split('\n').length;

                    return (
                      <div
                        className="w-6 flex-shrink-0 bg-gray-800 border-r border-gray-700 overflow-hidden relative"
                        ref={(el) => {
                          if (!el) return;

                          // Sync scroll position with Monaco
                          const syncScroll = () => {
                            if (editorRef.current && el) {
                              const scrollTop = editorRef.current.getScrollTop();
                              // Update transform instead of scrollTop for better performance
                              const contentEl = el.querySelector('.gutter-content');
                              if (contentEl) {
                                contentEl.style.transform = `translateY(-${scrollTop}px)`;
                              }
                            }
                          };

                          // Wait for Monaco editor to mount, then set up scroll sync
                          const setupScrollSync = () => {
                            if (editorRef.current) {
                              // Initial sync
                              syncScroll();

                              // Listen to Monaco scroll events
                              const disposable = editorRef.current.onDidScrollChange(syncScroll);
                              // Store disposable for cleanup
                              if (!editorRef.current._gutterDisposables) {
                                editorRef.current._gutterDisposables = [];
                              }
                              editorRef.current._gutterDisposables.push(disposable);
                            } else {
                              // Editor not ready, try again in a bit
                              requestAnimationFrame(setupScrollSync);
                            }
                          };

                          // Start setup
                          requestAnimationFrame(setupScrollSync);
                        }}
                      >
                        <div
                          className="gutter-content relative"
                          style={{
                            height: `${totalLines * 20}px`,
                            willChange: 'transform'
                          }}
                        >
                          {/* Render chevrons for each changed block */}
                          {changedBlocks.map((block, blockIndex) => (
                            <div
                              key={blockIndex}
                              className="absolute left-0 w-full group"
                              style={{
                                top: `${block.startLine * 20}px`,
                                height: `${(block.endLine - block.startLine + 1) * 20}px`
                              }}
                            >
                              {/* Highlight bar */}
                              <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/10 border-l-2 border-blue-500/30 transition-colors" />

                              {/* Revert chevron button */}
                              <button
                                onClick={() => {
                                  if (block.startLine === block.endLine) {
                                    handleRevertLine(block.startLine);
                                  } else {
                                    handleRevertBlock(block.startLine, block.endLine);
                                  }
                                }}
                                className="absolute top-0 left-0 w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-gray-600/90 hover:bg-blue-600 text-white rounded-sm shadow-md ml-0.5"
                                title={`Revert ${block.startLine === block.endLine ? 'line' : 'lines'} ${block.startLine + 1}${block.startLine !== block.endLine ? `-${block.endLine + 1}` : ''}`}
                              >
                                <ChevronLeft className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Editor Container */}
                  <div className="flex-1 relative flex flex-col">
                    <div className="bg-muted p-2 text-sm font-medium border-b flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span>Modified ({localCode.split('\n').length} lines)</span>
                        {collapseUnchanged && (
                          <Badge variant="secondary" className="text-xs">
                            <ChevronUp className="w-3 h-3 mr-1" />
                            Collapsed
                          </Badge>
                        )}
                      </div>
                      {(() => {
                        // Calculate stats from actual code comparison
                        const stats = getDiffStats(originalCode || '', localCode);
                        return (
                          <div className="flex items-center space-x-2 text-xs">
                            <span className="text-green-600">+{stats.additions}</span>
                            <span className="text-red-600">-{stats.deletions}</span>
                          </div>
                        );
                      })()}
                    </div>
                    <div className="flex-1">
                      <Editor
                        height="100%"
                        language={getMonacoLanguage()}
                        value={collapseUnchanged ? collapsedModified : localCode}
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
                          folding: true
                        }}
                        theme="vs-dark"
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })()
        ) : showDiffView && enableDiffDetection && fullFileDisplayLines.length > 0 ? (
          /* Enhanced Diff View with Statistics Panel and Revert Actions */
          <div className="h-full flex flex-col">
            {/* Diff Summary Panel */}
            {(() => {
              const stats = getDiffStats(originalCode || '', localCode);
              const additions = fullFileDisplayLines.filter(line => line.type === 'addition').length;
              const deletions = fullFileDisplayLines.filter(line => line.type === 'deletion').length;
              const context = fullFileDisplayLines.filter(line => line.type === 'context').length;
              
              return (
                <div className="border-b bg-muted/30 p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Diff className="w-4 h-4 text-blue-600" />
                        <span className="font-medium">Diff Summary</span>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center space-x-1">
                          <Plus className="w-3 h-3 text-green-600" />
                          <span className="text-green-600 font-medium">{additions}</span>
                          <span className="text-muted-foreground">additions</span>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <Minus className="w-3 h-3 text-red-600" />
                          <span className="text-red-600 font-medium">{deletions}</span>
                          <span className="text-muted-foreground">deletions</span>
                        </div>
                        
                        {stats.linesChanged > 0 && (
                          <div className="flex items-center space-x-1">
                            <FileText className="w-3 h-3 text-orange-600" />
                            <span className="text-orange-600 font-medium">{stats.linesChanged}</span>
                            <span className="text-muted-foreground">modified</span>
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-1">
                          <CheckCircle className="w-3 h-3 text-muted-foreground" />
                          <span className="text-muted-foreground">{context} unchanged</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {stats.changes > 0 && (
                        <Badge variant="outline" className="text-xs">
                          <GitBranch className="w-3 h-3 mr-1" />
                          {stats.changes} total changes
                        </Badge>
                      )}
                      
                      <Badge variant="secondary" className="text-xs">
                        <FileText className="w-3 h-3 mr-1" />
                        {fullFileDisplayLines.length} lines in diff
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Change Visualization Bar */}
                  <div className="mt-2">
                    <div className="flex h-2 rounded-full overflow-hidden bg-background">
                      {stats.totalLines > 0 && (
                        <>
                          {additions > 0 && (
                            <div 
                              className="bg-green-500"
                              style={{ width: `${(additions / stats.totalLines) * 100}%` }}
                              title={`${additions} additions`}
                            />
                          )}
                          {deletions > 0 && (
                            <div 
                              className="bg-red-500"
                              style={{ width: `${(deletions / stats.totalLines) * 100}%` }}
                              title={`${deletions} deletions`}
                            />
                          )}
                          {stats.linesChanged > 0 && (
                            <div 
                              className="bg-orange-500"
                              style={{ width: `${(stats.linesChanged / stats.totalLines) * 100}%` }}
                              title={`${stats.linesChanged} modifications`}
                            />
                          )}
                          {context > 0 && (
                            <div 
                              className="bg-muted-foreground/20"
                              style={{ width: `${(context / stats.totalLines) * 100}%` }}
                              title={`${context} unchanged lines`}
                            />
                          )}
                        </>
                      )}
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Original: {originalCode?.split('\n').length || 0} lines</span>
                      <span>Modified: {localCode.split('\n').length} lines</span>
                    </div>
                  </div>
                </div>
              );
            })()}
            
            {/* Diff Content */}
            <div className="flex-1 overflow-auto border">
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
                      <div key={index} className="group relative">
                        <DiffLine line={line} index={index} />
                        {/* PhpStorm-style revert button for changed lines */}
                        {line.type === 'addition' && line.newLineNumber && (
                          <button
                            onClick={() => {
                              const lineIndexInFile = line.newLineNumber - 1;
                              // For pure additions (no original), pass undefined to trigger deletion
                              const originalLine = line.originalContent !== null && line.originalContent !== undefined
                                ? line.originalContent
                                : undefined;
                              handleLineRevert(lineIndexInFile, originalLine);
                            }}
                            className="absolute left-2 top-1 w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-gray-700/90 hover:bg-blue-600 text-white rounded-sm"
                            title={line.originalContent ? "Revert to original" : "Remove added line"}
                          >
                            <ChevronLeft className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
            {showSplitView ? (
              <>
                <span>Split View</span>
                <span>{originalCode?.split('\n').length || 0} → {localCode.split('\n').length} lines</span>
              </>
            ) : showDiffView && diffData ? (
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
            {showSplitView && (
              <Badge variant="outline" className="text-xs">
                <Split className="w-3 h-3 mr-1" />
                Split View
              </Badge>
            )}
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

      {/* Restore Confirmation Modal */}
      {showRestoreModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-96">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Restore Original Content</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-orange-800">
                <strong>Warning:</strong> All current changes will be lost and the content will be restored to its original state.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setShowRestoreModal(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setLocalCode(originalCode || initialContent || '');
                  if (onChange) {
                    onChange(originalCode || initialContent || '');
                  }
                  setShowRestoreModal(false);
                }}
                variant="default"
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white border-orange-600"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Restore
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CodeEditor;