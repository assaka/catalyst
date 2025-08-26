import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  GitCompare,
  FileText,
  CheckCircle,
  XCircle,
  Plus,
  Minus,
  ArrowRight,
  Copy,
  Download,
  RefreshCw,
  Zap,
  Settings,
  Eye,
  EyeOff
} from 'lucide-react';

// Import diff service
import DiffService from '../../services/diff-service';

// SplitViewPane component for enhanced split view
const SplitViewPane = ({ 
  lines, 
  diffLines, 
  side, 
  showLineNumbers, 
  showWhitespace, 
  onLineRevert, 
  originalLines 
}) => {
  // Create a mapping of line numbers to diff types for highlighting
  const getDiffTypeForLine = (lineIndex) => {
    const diffLine = diffLines.find(dl => {
      if (side === 'original') {
        return dl.lineNumber === lineIndex + 1;
      } else {
        return dl.newLineNumber === lineIndex + 1;
      }
    });
    
    return diffLine?.type || 'context';
  };

  const getLineStyle = (lineIndex, diffType) => {
    switch (diffType) {
      case 'addition':
        return side === 'modified' ? 'bg-green-50 border-l-4 border-green-500' : 'bg-gray-100';
      case 'deletion':
        return side === 'original' ? 'bg-red-50 border-l-4 border-red-500' : 'bg-gray-100';
      case 'context':
      default:
        return 'bg-background hover:bg-muted/30';
    }
  };

  const formatLine = (line) => {
    if (!showWhitespace) return line;
    return line.replace(/ /g, '·').replace(/\t/g, '→   ');
  };

  return (
    <div className="font-mono">
      {lines.map((line, index) => {
        const diffType = getDiffTypeForLine(index);
        const shouldShow = side === 'original' 
          ? diffType !== 'addition' 
          : diffType !== 'deletion';

        if (!shouldShow && diffType !== 'context') {
          return null;
        }

        return (
          <div
            key={index}
            className={`flex items-center px-2 py-1 text-sm ${getLineStyle(index, diffType)} group`}
          >
            {showLineNumbers && (
              <div className="w-12 text-muted-foreground text-right pr-2 flex-shrink-0">
                {index + 1}
              </div>
            )}
            <div className="flex-1 pl-2 flex items-center justify-between">
              <span className={`${diffType === 'addition' && side === 'modified' ? 'text-green-700' : 
                                diffType === 'deletion' && side === 'original' ? 'text-red-700' : 
                                'text-foreground'}`}>
                {formatLine(line) || ' '}
              </span>
              
              {/* Show permanent right arrow for modified lines on the original side */}
              {side === 'original' && diffType === 'deletion' && onLineRevert && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-2 h-6 px-2 text-blue-600 hover:text-blue-800"
                  onClick={() => onLineRevert(index, line)}
                  title="Undo this change"
                >
                  <ArrowRight className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const DiffPreviewSystem = ({ 
  patches = [], 
  originalCode = '', 
  modifiedCode = '',
  fileName = 'file',
  className = '',
  onCodeChange
}) => {
  const [selectedView, setSelectedView] = useState('unified');
  const [lineNumbers, setLineNumbers] = useState(true);
  const [contextLines, setContextLines] = useState(3);
  const [algorithm, setAlgorithm] = useState('myers');
  const [showWhitespace, setShowWhitespace] = useState(false);
  const [currentModifiedCode, setCurrentModifiedCode] = useState(modifiedCode);

  const diffServiceRef = useRef(new DiffService());
  const originalBaseCodeRef = useRef(originalCode); // Preserve original base code
  
  // Update current modified code when props change
  useEffect(() => {
    setCurrentModifiedCode(modifiedCode);
  }, [modifiedCode]);
  
  // Preserve original base code reference
  useEffect(() => {
    originalBaseCodeRef.current = originalCode;
  }, [originalCode]);

  // Handle line revert functionality
  const handleLineRevert = useCallback((lineIndex, originalLine) => {
    const currentLines = currentModifiedCode.split('\n');
    const originalLines = originalBaseCodeRef.current.split('\n');
    
    // Revert the specific line to its original content
    if (lineIndex < currentLines.length) {
      currentLines[lineIndex] = originalLines[lineIndex] || '';
      const newCode = currentLines.join('\n');
      setCurrentModifiedCode(newCode);
      
      // Notify parent component of the change
      if (onCodeChange) {
        onCodeChange(newCode);
      }
    }
  }, [currentModifiedCode, onCodeChange]);

  // Calculate diff using DiffService (always compare against original base code)
  const diffResult = useMemo(() => {
    const baseCode = originalBaseCodeRef.current;
    
    if (!baseCode && !currentModifiedCode) {
      return { 
        success: true,
        diff: [], 
        stats: { additions: 0, deletions: 0, modifications: 0, unchanged: 0 },
        unifiedDiff: '',
        metadata: null
      };
    }

    const result = diffServiceRef.current.createDiff(baseCode, currentModifiedCode, { algorithm });
    const stats = diffServiceRef.current.getDiffStats(result.diff);
    const unifiedDiff = diffServiceRef.current.createUnifiedDiff(baseCode, currentModifiedCode, fileName);
    
    return {
      ...result,
      stats: stats || { additions: 0, deletions: 0, modifications: 0, unchanged: 0 },
      unifiedDiff
    };
  }, [currentModifiedCode, algorithm, fileName]);

  // Convert DiffService diff to displayable lines for UI
  const convertDiffToDisplayLines = (diff) => {
    const originalLines = originalBaseCodeRef.current.split('\n');
    const modifiedLines = currentModifiedCode.split('\n');
    const displayLines = [];
    
    let originalIndex = 0;
    let modifiedIndex = 0;
    
    diff.forEach((change, index) => {
      switch (change.type) {
        case 'equal':
          displayLines.push({
            type: 'context',
            lineNumber: originalIndex + 1,
            newLineNumber: modifiedIndex + 1,
            content: change.value,
            originalContent: change.value
          });
          originalIndex++;
          modifiedIndex++;
          break;
          
        case 'delete':
          const deleteValues = Array.isArray(change.value) ? change.value : [change.value];
          deleteValues.forEach(value => {
            displayLines.push({
              type: 'deletion',
              lineNumber: originalIndex + 1,
              newLineNumber: null,
              content: value,
              originalContent: value
            });
            originalIndex++;
          });
          break;
          
        case 'insert':
          const insertValues = Array.isArray(change.value) ? change.value : [change.value];
          insertValues.forEach(value => {
            displayLines.push({
              type: 'addition',
              lineNumber: null,
              newLineNumber: modifiedIndex + 1,
              content: value,
              originalContent: null
            });
            modifiedIndex++;
          });
          break;
      }
    });
    
    return displayLines;
  };

  // Get display lines from diff
  const displayLines = useMemo(() => {
    if (!diffResult.diff || diffResult.diff.length === 0) return [];
    return convertDiffToDisplayLines(diffResult.diff);
  }, [diffResult.diff, originalCode, modifiedCode]);

  const copyDiff = () => {
    navigator.clipboard.writeText(diffResult.unifiedDiff);
  };

  const exportDiff = () => {
    const blob = new Blob([diffResult.unifiedDiff], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName || 'file'}.diff`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const DiffLine = ({ line, index }) => {
    const getLineStyle = () => {
      switch (line.type) {
        case 'addition':
          return 'bg-green-50 border-l-4 border-green-500';
        case 'deletion':
          return 'bg-red-50 border-l-4 border-red-500';
        case 'modification':
          return 'bg-yellow-50 border-l-4 border-yellow-500';
        default:
          return 'bg-background';
      }
    };

    const getLineIcon = () => {
      switch (line.type) {
        case 'addition':
          return <Plus className="w-3 h-3 text-green-600" />;
        case 'deletion':
          return <Minus className="w-3 h-3 text-red-600" />;
        case 'modification':
          return <ArrowRight className="w-3 h-3 text-yellow-600" />;
        default:
          return null;
      }
    };

    return (
      <div className={`flex items-center px-2 py-1 text-sm font-mono ${getLineStyle()}`}>
        {lineNumbers && (
          <>
            <div className="w-12 text-muted-foreground text-right pr-2">
              {line.lineNumber || ''}
            </div>
            <div className="w-12 text-muted-foreground text-right pr-2">
              {line.newLineNumber || ''}
            </div>
          </>
        )}
        
        <div className="w-6 flex items-center justify-center">
          {getLineIcon()}
        </div>
        
        <div className="flex-1 pl-2">
          {line.type === 'modification' ? (
            <div className="space-y-1">
              <div className="text-red-600 line-through">
                {line.originalContent}
              </div>
              <div className="text-green-600">
                {line.content}
              </div>
            </div>
          ) : (
            <span className={
              line.type === 'addition' ? 'text-green-600' :
              line.type === 'deletion' ? 'text-red-600' :
              'text-foreground'
            }>
              {line.content}
            </span>
          )}
        </div>
      </div>
    );
  };

  const PatchSummary = ({ patch, index }) => (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-medium">{patch.name || `Patch ${index + 1}`}</h4>
          <p className="text-sm text-muted-foreground mt-1">
            {patch.description || 'No description available'}
          </p>
        </div>
        <Badge variant={patch.type === 'json-patch' ? 'default' : 'secondary'}>
          {patch.type}
        </Badge>
      </div>
      
      {patch.stats && (
        <div className="flex items-center space-x-4 mt-3 text-sm">
          <div className="flex items-center text-green-600">
            <Plus className="w-3 h-3 mr-1" />
            +{patch.stats.additions || 0}
          </div>
          <div className="flex items-center text-red-600">
            <Minus className="w-3 h-3 mr-1" />
            -{patch.stats.deletions || 0}
          </div>
          {patch.stats.changes > 0 && (
            <div className="flex items-center text-yellow-600">
              <ArrowRight className="w-3 h-3 mr-1" />
              ~{patch.stats.changes}
            </div>
          )}
        </div>
      )}
    </Card>
  );

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <GitCompare className="w-5 h-5" />
            <h3 className="text-lg font-semibold">Diff Preview</h3>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center text-green-600">
                <Plus className="w-3 h-3 mr-1" />
                +{diffResult.stats.additions}
              </div>
              <div className="flex items-center text-red-600">
                <Minus className="w-3 h-3 mr-1" />
                -{diffResult.stats.deletions}
              </div>
              <div className="flex items-center text-yellow-600">
                <ArrowRight className="w-3 h-3 mr-1" />
                ~{diffResult.stats.modifications}
              </div>
              <div className="flex items-center text-blue-600 text-xs">
                <CheckCircle className="w-3 h-3 mr-1" />
                {diffResult.stats.unchanged}
              </div>
            </div>
            
            <Separator orientation="vertical" className="h-6" />
            
            <Button variant="outline" size="sm" onClick={copyDiff}>
              <Copy className="w-4 h-4 mr-1" />
              Copy
            </Button>
            
            <Button variant="outline" size="sm" onClick={exportDiff}>
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        <Tabs value={selectedView} onValueChange={setSelectedView} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="unified">Unified Diff</TabsTrigger>
            <TabsTrigger value="split">Split View</TabsTrigger>
            <TabsTrigger value="raw">Raw Diff</TabsTrigger>
            <TabsTrigger value="patches">Patches</TabsTrigger>
          </TabsList>

          <TabsContent value="unified" className="flex-1 m-0">
            <div className="h-full flex flex-col">
              {/* Controls */}
              <div className="border-b p-2 bg-muted/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={lineNumbers}
                        onChange={(e) => setLineNumbers(e.target.checked)}
                      />
                      <span>Line numbers</span>
                    </label>
                    
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={showWhitespace}
                        onChange={(e) => setShowWhitespace(e.target.checked)}
                      />
                      <span>Whitespace</span>
                    </label>
                    
                    <div className="flex items-center space-x-2">
                      <span>Context:</span>
                      <select
                        value={contextLines}
                        onChange={(e) => setContextLines(Number(e.target.value))}
                        className="px-2 py-1 border rounded text-xs"
                      >
                        <option value={1}>1</option>
                        <option value={3}>3</option>
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm">
                    <span>Algorithm:</span>
                    <select
                      value={algorithm}
                      onChange={(e) => setAlgorithm(e.target.value)}
                      className="px-2 py-1 border rounded text-xs"
                    >
                      <option value="myers">Myers</option>
                      <option value="patience">Patience</option>
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Diff Content */}
              <ScrollArea className="flex-1">
                {displayLines.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-muted-foreground">
                      <FileText className="w-8 h-8 mx-auto mb-2" />
                      <p>No differences to display</p>
                      <p className="text-sm mt-1">
                        The original and modified code are identical
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="font-mono">
                    {displayLines.map((line, index) => (
                      <DiffLine key={index} line={line} index={index} />
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="split" className="flex-1 m-0">
            <div className="h-full flex flex-col">
              {/* Split View Controls */}
              <div className="border-b p-2 bg-muted/50">
                <div className="flex items-center space-x-4 text-sm">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={lineNumbers}
                      onChange={(e) => setLineNumbers(e.target.checked)}
                    />
                    <span>Line numbers</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={showWhitespace}
                      onChange={(e) => setShowWhitespace(e.target.checked)}
                    />
                    <span>Whitespace</span>
                  </label>
                </div>
              </div>
              
              <div className="flex-1 grid grid-cols-2">
                <div className="border-r flex flex-col">
                  <div className="border-b p-2 bg-red-50">
                    <h4 className="font-medium text-red-900">Original ({originalBaseCodeRef.current.split('\n').length} lines)</h4>
                  </div>
                  <ScrollArea className="flex-1">
                    <SplitViewPane 
                      lines={originalBaseCodeRef.current.split('\n')} 
                      diffLines={displayLines}
                      side="original" 
                      showLineNumbers={lineNumbers}
                      showWhitespace={showWhitespace}
                    />
                  </ScrollArea>
                </div>
                
                <div className="flex flex-col">
                  <div className="border-b p-2 bg-green-50 flex justify-between items-center">
                    <h4 className="font-medium text-green-900">Modified ({currentModifiedCode.split('\n').length} lines)</h4>
                    <div className="text-xs text-green-700">
                      Hover over changed lines to revert
                    </div>
                  </div>
                  <ScrollArea className="flex-1">
                    <SplitViewPane 
                      lines={currentModifiedCode.split('\n')} 
                      diffLines={displayLines}
                      side="modified" 
                      showLineNumbers={lineNumbers}
                      showWhitespace={showWhitespace}
                      onLineRevert={handleLineRevert}
                      originalLines={originalBaseCodeRef.current.split('\n')}
                    />
                  </ScrollArea>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="raw" className="flex-1 m-0">
            <div className="h-full flex flex-col">
              <div className="border-b p-2 bg-muted/50 flex items-center justify-between">
                <h4 className="font-medium">Git-style Unified Diff</h4>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="text-xs">
                    {diffResult.metadata?.algorithm || algorithm}
                  </Badge>
                  <Button variant="ghost" size="sm" onClick={copyDiff}>
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              <ScrollArea className="flex-1">
                <pre className="p-4 text-sm font-mono whitespace-pre-wrap">
                  {diffResult.unifiedDiff || 'No differences to display'}
                </pre>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="patches" className="flex-1 m-0 p-4">
            <div className="space-y-4">
              {patches.length === 0 ? (
                <Card className="p-8 text-center">
                  <Zap className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">No patches available</p>
                  <p className="text-sm mt-1">
                    Patches will appear here when generated by the AI
                  </p>
                </Card>
              ) : (
                patches.map((patch, index) => (
                  <PatchSummary key={index} patch={patch} index={index} />
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DiffPreviewSystem;