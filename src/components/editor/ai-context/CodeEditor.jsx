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
import { useStoreSelection } from '@/contexts/StoreSelectionContext';

// PreviewFrame component for server-side preview
const PreviewFrame = ({ sourceCode, originalCode, fileName, language }) => {
  const [previewUrl, setPreviewUrl] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { selectedStore, loading: storeLoading } = useStoreSelection();
  const storeId = selectedStore?.id;
  const hasStoreId = !!storeId;

  // Debug store context
  useEffect(() => {
    console.log('🏪 PreviewFrame store context:', { 
      selectedStore,
      storeId, 
      hasStoreId, 
      storeLoading,
      storeIdType: typeof storeId,
      storeName: selectedStore?.name
    });
  }, [selectedStore, storeId, hasStoreId, storeLoading]);

  // Create preview session with server-side rendering
  useEffect(() => {
    const createPreviewSession = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Validate that we have a proper store context
        if (!hasStoreId || !storeId) {
          throw new Error('No store selected. Please select a store from the store selector to use preview functionality.');
        }
        
        // Determine target path from current location or fileName
        let targetPath = '/';
        const currentPath = window.location.pathname;
        
        if (fileName?.includes('Cart') || currentPath.includes('/cart')) {
          targetPath = '/cart';
        } else if (fileName?.includes('Checkout') || currentPath.includes('/checkout')) {
          targetPath = '/checkout';
        } else if (fileName?.includes('Storefront') || currentPath.includes('/shop')) {
          targetPath = '/shop';
        } else if (fileName?.includes('ProductDetail') || currentPath.includes('/products')) {
          targetPath = '/products';
        }

        console.log('🎬 Creating preview session:', {
          storeId,
          fileName,
          targetPath,
          hasOriginalCode: !!originalCode,
          hasSourceCode: !!sourceCode,
          originalCodeLength: originalCode?.length || 0,
          sourceCodeLength: sourceCode?.length || 0,
          currentPath: window.location.pathname,
          storeIdType: typeof storeId,
          storeIdValid: hasStoreId
        });

        // Call the new preview API
        const backendUrl = process.env.REACT_APP_API_BASE_URL || 'https://catalyst-backend-fzhu.onrender.com';
        const response = await fetch(`${backendUrl}/api/preview/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            storeId,
            fileName: fileName || 'unknown.jsx',
            originalCode: originalCode || '',
            modifiedCode: sourceCode || '',
            language: language || 'javascript',
            targetPath
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Preview API error:', {
            status: response.status,
            statusText: response.statusText,
            error: errorText
          });
          throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
        }

        const result = await response.json();
        console.log('📋 Preview API response:', result);
        
        if (result.success) {
          const fullPreviewUrl = `${backendUrl}${result.data.previewUrl}`;
          setPreviewUrl(fullPreviewUrl);
          setSessionId(result.data.sessionId);
          
          console.log('✅ Preview session created:', {
            sessionId: result.data.sessionId,
            fileName: result.data.fileName,
            targetPath: result.data.targetPath,
            previewUrl: fullPreviewUrl
          });
        } else {
          console.error('❌ Preview session failed:', result);
          throw new Error(result.error || 'Failed to create preview session');
        }
        
      } catch (error) {
        console.error('❌ Error creating preview session:', error);
        setError(`Failed to create preview: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    if (sourceCode && originalCode && fileName && hasStoreId) {
      createPreviewSession();
    }
  }, [sourceCode, originalCode, fileName, language, storeId, hasStoreId]);

  if (storeLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-muted/20">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin text-blue-500" />
          <p className="text-sm text-muted-foreground">Loading store context...</p>
        </div>
      </div>
    );
  }

  if (!hasStoreId || !storeId) {
    return (
      <div className="h-full flex items-center justify-center bg-yellow-50 dark:bg-yellow-900/10">
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
          <p className="text-sm text-yellow-600 dark:text-yellow-400">No store selected</p>
          <p className="text-xs text-muted-foreground mt-1">Please select a store to use preview functionality</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-muted/20">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin text-blue-500" />
          <p className="text-sm text-muted-foreground">Generating preview...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-red-50 dark:bg-red-900/10">
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-red-500" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full relative">
      <iframe
        src={previewUrl}
        className="w-full h-full border-0"
        title="Live Preview"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads allow-top-navigation-by-user-activation"
        referrerPolicy="no-referrer-when-downgrade"
        onLoad={() => {
          console.log('✅ Preview iframe loaded successfully');
          // Apply customizations to the iframe content
          try {
            const iframe = document.querySelector('iframe[title="Live Preview"]');
            if (iframe?.contentWindow) {
              iframe.contentWindow.postMessage({
                type: 'APPLY_PREVIEW_CUSTOMIZATIONS',
                data: {
                  original: originalCode,
                  modified: sourceCode,
                  fileName,
                  language
                }
              }, '*');
            }
          } catch (error) {
            console.warn('Could not communicate with preview iframe:', error);
          }
        }}
        onError={() => {
          console.error('❌ Preview iframe failed to load');
          setError('Failed to load preview');
        }}
      />
      
      {/* Preview overlay info */}
      <div className="absolute top-2 left-2 bg-blue-500/90 text-white px-2 py-1 rounded text-xs font-medium">
        <Eye className="w-3 h-3 inline mr-1" />
        Preview Mode
      </div>
    </div>
  );
};

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
  const [versionHistory, setVersionHistory] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [showPreviewFrame, setShowPreviewFrame] = useState(false);

  const editorRef = useRef(null);
  const diffServiceRef = useRef(new UnifiedDiffFrontendService());
  
  // Helper function to get diff stats
  // Enhanced diff statistics
  const getDiffStats = useCallback((oldCode, newCode) => {
    if (!oldCode || !newCode) {
      return { additions: 0, deletions: 0, changes: 0, linesChanged: 0, unchanged: 0 };
    }

    const oldLines = oldCode.split('\n');
    const newLines = newCode.split('\n');
    
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
      return { original: originalCode, modified: modifiedCode };
    }
    
    const originalLines = originalCode.split('\n');
    const modifiedLines = modifiedCode.split('\n');
    const maxLines = Math.max(originalLines.length, modifiedLines.length);
    
    const collapsedOriginal = [];
    const collapsedModified = [];
    let unchangedCount = 0;
    let lastShownLine = -1;
    
    for (let i = 0; i < maxLines; i++) {
      const origLine = originalLines[i] || '';
      const modLine = modifiedLines[i] || '';
      const isChanged = origLine !== modLine;
      
      if (isChanged) {
        // If we have accumulated unchanged lines, add a collapse indicator
        if (unchangedCount > 3) {
          collapsedOriginal.push(`\n... ${unchangedCount - 2} unchanged lines ...\n`);
          collapsedModified.push(`\n... ${unchangedCount - 2} unchanged lines ...\n`);
        } else if (unchangedCount > 0) {
          // Add the unchanged lines if there are only a few
          for (let j = lastShownLine + 1; j < i; j++) {
            collapsedOriginal.push(originalLines[j] || '');
            collapsedModified.push(modifiedLines[j] || '');
          }
        }
        
        // Add the changed line
        collapsedOriginal.push(origLine);
        collapsedModified.push(modLine);
        
        // Add context lines (1 line before and after if available)
        if (i + 1 < maxLines && originalLines[i + 1] === modifiedLines[i + 1]) {
          collapsedOriginal.push(originalLines[i + 1] || '');
          collapsedModified.push(modifiedLines[i + 1] || '');
          i++; // Skip this line in the next iteration
        }
        
        unchangedCount = 0;
        lastShownLine = i;
      } else {
        unchangedCount++;
      }
    }
    
    // Handle remaining unchanged lines at the end
    if (unchangedCount > 3) {
      collapsedOriginal.push(`\n... ${unchangedCount - 1} unchanged lines ...\n`);
      collapsedModified.push(`\n... ${unchangedCount - 1} unchanged lines ...\n`);
    } else if (unchangedCount > 0) {
      for (let j = lastShownLine + 1; j < maxLines; j++) {
        collapsedOriginal.push(originalLines[j] || '');
        collapsedModified.push(modifiedLines[j] || '');
      }
    }
    
    return {
      original: collapsedOriginal.join('\n'),
      modified: collapsedModified.join('\n')
    };
  }, [collapseUnchanged]);
  
  // Handle version restoration
  const handleRestoreVersion = useCallback((version) => {
    setLocalCode(version.content);
    setSelectedVersion(version);
    
    // Apply hooks
    hookSystem.do('codeEditor.versionRestored', {
      fileName,
      version,
      restoredCode: version.content
    });
    
    // Emit event
    eventSystem.emit('codeEditor.versionRestored', {
      fileName,
      version,
      restoredCode: version.content
    });
    
    if (onChange) {
      onChange(version.content);
    }
  }, [fileName, onChange]);
  
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
    
    let currentBlock = null;
    const maxLines = Math.max(originalLines.length, modifiedLines.length);
    
    for (let i = 0; i < maxLines; i++) {
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
    
    // Add to version history
    if (processedCode !== value) {
      const historyEntry = {
        id: Date.now(),
        timestamp: new Date(),
        content: processedCode,
        description: 'Code modification',
        changeStats: getDiffStats(value, processedCode)
      };
      setVersionHistory(prev => [historyEntry, ...prev.slice(0, 19)]); // Keep last 20 versions
    }
    
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

  const handleUndo = async () => {
    if (editorRef.current) {
      console.log('🔄 [CodeEditor] Handling undo with hook system');
      
      try {
        const codeBeforeUndo = editorRef.current.getValue();
        
        // Apply undo hook
        const shouldUndo = hookSystem.apply('codeEditor.beforeUndo', true, {
          fileName,
          currentCode: codeBeforeUndo
        });
        
        if (!shouldUndo) {
          console.log('Undo operation cancelled by hook');
          return;
        }
        
        const undoAction = editorRef.current.getAction('undo');
        if (!undoAction) {
          console.warn('⚠️ [CodeEditor] Undo action not available');
          return;
        }
        
        await undoAction.run();
        const codeAfterUndo = editorRef.current.getValue();
        
        // Emit undo event
        eventSystem.emit('codeEditor.undoPerformed', {
          fileName,
          beforeCode: codeBeforeUndo,
          afterCode: codeAfterUndo
        });
        
        // Update diff if enabled
        if (enableDiffDetection && originalCode && codeBeforeUndo !== codeAfterUndo) {
          const diffResult = diffServiceRef.current.createDiff(originalCode, codeAfterUndo);
          if (diffResult) {
            setDiffData(diffResult);
            const displayLines = generateFullFileDisplayLines(diffResult.parsedDiff, originalCode, codeAfterUndo);
            setFullFileDisplayLines(displayLines);
          }
        }
        
        // Update button states
        setTimeout(() => {
          try {
            const model = editorRef.current.getModel();
            if (model && model.canUndo && model.canRedo) {
              setCanUndo(model.canUndo());
              setCanRedo(model.canRedo());

            }
          } catch (error) {
            console.warn('Could not update undo/redo state after undo:', error);
          }
        }, 100);
        
      } catch (error) {
        console.error('❌ [CodeEditor] Error during undo operation:', error);
      }
    }
  };

  const handleRedo = async () => {
    if (editorRef.current) {
      console.log('🔄 [CodeEditor] Handling redo with hook system');
      
      try {
        const codeBeforeRedo = editorRef.current.getValue();
        
        // Apply redo hook
        const shouldRedo = hookSystem.apply('codeEditor.beforeRedo', true, {
          fileName,
          currentCode: codeBeforeRedo
        });
        
        if (!shouldRedo) {
          console.log('Redo operation cancelled by hook');
          return;
        }
        
        const redoAction = editorRef.current.getAction('redo');
        if (!redoAction) {
          console.warn('⚠️ [CodeEditor] Redo action not available');
          return;
        }
        
        redoAction.run();
        const codeAfterRedo = editorRef.current.getValue();
        
        // Emit redo event
        eventSystem.emit('codeEditor.redoPerformed', {
          fileName,
          beforeCode: codeBeforeRedo,
          afterCode: codeAfterRedo
        });
        
        // Update diff if enabled
        if (enableDiffDetection && originalCode && codeBeforeRedo !== codeAfterRedo) {
          const diffResult = diffServiceRef.current.createDiff(originalCode, codeAfterRedo);
          if (diffResult) {
            setDiffData(diffResult);
            const displayLines = generateFullFileDisplayLines(diffResult.parsedDiff, originalCode, codeAfterRedo);
            setFullFileDisplayLines(displayLines);
          }
        }
        
        // Update button states
        setTimeout(() => {
          try {
            const model = editorRef.current.getModel();
            if (model && model.canUndo && model.canRedo) {
              setCanUndo(model.canUndo());
              setCanRedo(model.canRedo());
            }
          } catch (error) {
            console.warn('Could not update undo/redo state after redo:', error);
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
              onClick={handleSave}
              disabled={!isModified || readOnly}
            >
              <Save className="w-4 h-4" />
            </Button>

            {/* Always show Preview eye, other buttons only when diff detection is enabled */}
            <Button
              variant={showPreviewFrame ? "default" : "ghost"}
              size="sm"
              onClick={() => setShowPreviewFrame(!showPreviewFrame)}
              title="Show Preview Frame"
            >
              <Eye className="w-4 h-4" />
            </Button>
            
            {enableDiffDetection && diffData && (
              <>
                <Button
                  variant={!showSplitView && !showDiffView && !showPreviewFrame ? "default" : "ghost"}
                  size="sm"
                  onClick={() => {
                    setShowSplitView(false);
                    setShowDiffView(false);
                    setShowPreviewFrame(false);
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
                    setShowPreviewFrame(false);
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
                    setShowPreviewFrame(false);
                  }}
                  title="Show Diff View"
                >
                  <Diff className="w-4 h-4" />
                </Button>
              </>
            )}
            
            {versionHistory.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowVersionHistory(!showVersionHistory)}
                title="View Version History"
              >
                <History className="w-4 h-4" />
              </Button>
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
            
                {/* Modified Code */}
                <div className="flex-1 relative">
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
                    {diffData && (
                      <div className="flex items-center space-x-2 text-xs">
                        <span className="text-green-600">+{diffData.metadata?.additions || 0}</span>
                        <span className="text-red-600">-{diffData.metadata?.deletions || 0}</span>
                      </div>
                    )}
                  </div>
                  <div className="relative h-[calc(100%-40px)]">
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
                        glyphMargin: true,
                        folding: true
                      }}
                      theme="vs-dark"
                    />
                    {/* Revert Gutter for Split View */}
                    {!collapseUnchanged && (
                      <RevertGutter
                        changedBlocks={getChangedBlocks()}
                        onRevertLine={handleRevertLine}
                        onRevertBlock={handleRevertBlock}
                      />
                    )}
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
                        {/* Revert button for modified lines */}
                        {line.type === 'addition' && line.originalContent && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleRevertLine(index)}
                            title="Revert this line"
                          >
                            <RotateCcw className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : showPreviewFrame ? (
          /* Preview Frame View */
          <div className="h-full flex flex-col">
            <div className="border-b bg-muted p-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Eye className="w-4 h-4 text-blue-600" />
                  <span className="font-medium">Live Preview</span>
                  <Badge variant="secondary" className="text-xs">
                    Production Ready
                  </Badge>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-muted-foreground">
                    Changes applied automatically
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPreviewFrame(false)}
                    title="Close Preview"
                  >
                    <Minimize2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="flex-1">
              <PreviewFrame 
                sourceCode={localCode}
                originalCode={originalCode}
                fileName={fileName}
                language={language}
              />
            </div>
          </div>
        ) : showVersionHistory ? (
          /* Version History View */
          <div className="h-full flex">
            {/* Version List */}
            <div className="w-80 border-r bg-muted/50">
              <div className="p-3 border-b bg-muted">
                <h3 className="font-medium">Version History</h3>
                <p className="text-xs text-muted-foreground">{versionHistory.length} versions</p>
              </div>
              <div className="overflow-y-auto">
                {versionHistory.map((version) => (
                  <div
                    key={version.id}
                    className={`p-3 border-b cursor-pointer hover:bg-background transition-colors ${
                      selectedVersion?.id === version.id ? 'bg-primary/10 border-primary' : ''
                    }`}
                    onClick={() => setSelectedVersion(version)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{version.description}</span>
                      <Badge variant="outline" className="text-xs">
                        {version.changeStats.changes} changes
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {version.timestamp.toLocaleString()}
                    </div>
                    <div className="flex items-center space-x-2 mt-2 text-xs">
                      <span className="text-green-600">+{version.changeStats.additions}</span>
                      <span className="text-red-600">-{version.changeStats.deletions}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Version Preview */}
            <div className="flex-1 flex flex-col">
              {selectedVersion ? (
                <>
                  <div className="p-3 border-b bg-muted flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{selectedVersion.description}</h4>
                      <p className="text-xs text-muted-foreground">
                        {selectedVersion.timestamp.toLocaleString()}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleRestoreVersion(selectedVersion)}
                      title="Restore this version"
                    >
                      <RotateCcw className="w-4 h-4 mr-1" />
                      Restore
                    </Button>
                  </div>
                  <Editor
                    height="100%"
                    language={getMonacoLanguage()}
                    value={selectedVersion.content}
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      fontSize: 14,
                      automaticLayout: true
                    }}
                    theme="vs-dark"
                  />
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <History className="w-8 h-8 mx-auto mb-2" />
                    <p>Select a version to preview</p>
                  </div>
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
            ) : showPreviewFrame ? (
              <>
                <span>Preview Frame</span>
                <span>Live preview active</span>
              </>
            ) : showVersionHistory ? (
              <>
                <span>Version History</span>
                <span>{versionHistory.length} versions</span>
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
            {showPreviewFrame && (
              <Badge variant="outline" className="text-xs">
                <Eye className="w-3 h-3 mr-1" />
                Preview
              </Badge>
            )}
            {showVersionHistory && (
              <Badge variant="outline" className="text-xs">
                <History className="w-3 h-3 mr-1" />
                History
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