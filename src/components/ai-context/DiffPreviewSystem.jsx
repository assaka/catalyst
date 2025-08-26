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
  ArrowLeft,
  Copy,
  Download,
  RefreshCw,
  Zap,
  Settings,
  Eye,
  EyeOff,
  Check,
  RotateCcw,
  ExternalLink
} from 'lucide-react';

// Import diff service
import DiffService from '../../services/diff-service';

// Utility function to extract component name from file path or code
const extractComponentName = (fileName, code) => {
  // Try to extract from file name first
  if (fileName && fileName.includes('.')) {
    const nameWithoutExt = fileName.split('.')[0];
    const componentName = nameWithoutExt.replace(/([a-z])([A-Z])/g, '$1 $2').trim();
    if (componentName) return componentName;
  }
  
  // Try to extract from code (look for component export or class name)
  const exportMatches = code.match(/export\s+(?:default\s+)?(?:function|class|const)\s+(\w+)|const\s+(\w+)\s*=.*=>/);
  if (exportMatches) {
    const componentName = exportMatches[1] || exportMatches[2];
    return componentName.replace(/([a-z])([A-Z])/g, '$1 $2').trim();
  }
  
  return fileName || 'Unknown';
};

// Function to resolve page URL using store routes API
const resolvePageURL = async (pageName, storeId) => {
  try {
    const response = await fetch(`/api/store-routes/public/find-by-page/${encodeURIComponent(pageName)}?store_id=${storeId}`);
    
    if (response.ok) {
      const data = await response.json();
      if (data.success && data.data.route) {
        return {
          success: true,
          path: data.data.route.route_path,
          url: `${window.location.origin}${data.data.route.route_path}`
        };
      }
    }
    
    // Fallback: create a generic path based on page name
    const fallbackPath = `/${pageName.toLowerCase().replace(/\s+/g, '-')}`;
    return {
      success: false,
      path: fallbackPath,
      url: `${window.location.origin}${fallbackPath}`,
      fallback: true
    };
  } catch (error) {
    console.error('Error resolving page URL:', error);
    const fallbackPath = `/${pageName.toLowerCase().replace(/\s+/g, '-')}`;
    return {
      success: false,
      path: fallbackPath,
      url: `${window.location.origin}${fallbackPath}`,
      fallback: true,
      error: error.message
    };
  }
};

// SplitViewPane component for enhanced split view
const SplitViewPane = ({ 
  lines, 
  diffLines, 
  side, 
  showLineNumbers, 
  showWhitespace, 
  onLineRevert, 
  originalLines,
  modifiedLines
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
    <div className="font-mono min-w-max">
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
            className={`flex items-center px-2 py-1 text-sm min-w-max ${getLineStyle(index, diffType)} group`}
          >
            {/* Show revert button before line numbers for modified lines on the original side */}
            {side === 'original' && onLineRevert && originalLines && modifiedLines && 
             originalLines[index] !== undefined && modifiedLines[index] !== undefined &&
             originalLines[index] !== modifiedLines[index] ? (
              <Button
                variant="ghost"
                size="sm"
                className="w-8 h-8 p-0 mr-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 flex-shrink-0"
                onClick={() => onLineRevert(index, line)}
                title="Revert this line to original"
              >
                <RotateCcw className="w-3 h-3" />
              </Button>
            ) : (
              <div className="w-8 mr-1 flex-shrink-0" />
            )}
            
            {showLineNumbers && (
              <div className="w-12 text-muted-foreground text-right pr-2 flex-shrink-0">
                {index + 1}
              </div>
            )}
            <div className="flex-1 pl-2 min-w-0">
              <span className={`${diffType === 'addition' && side === 'modified' ? 'text-green-700' : 
                                diffType === 'deletion' && side === 'original' ? 'text-red-700' : 
                                'text-foreground'} whitespace-nowrap block`}>
                {formatLine(line) || ' '}
              </span>
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
  onCodeChange,
  onDiffStatsChange, // New callback to notify parent about diff state changes
  storeId = '157d4590-49bf-4b0b-bd77-abe131909528' // Store ID for route resolution
}) => {
  const [selectedView, setSelectedView] = useState('unified');
  const [lineNumbers, setLineNumbers] = useState(true);
  const [contextLines, setContextLines] = useState(3);
  const [algorithm, setAlgorithm] = useState('myers');
  const [showWhitespace, setShowWhitespace] = useState(false);
  const [currentModifiedCode, setCurrentModifiedCode] = useState(modifiedCode);
  const [copyStatus, setCopyStatus] = useState({ copied: false, error: null });
  const [previewStatus, setPreviewStatus] = useState({ loading: false, error: null, url: null });

  const diffServiceRef = useRef(new DiffService());
  const originalBaseCodeRef = useRef(originalCode); // Preserve original base code
  const originalScrollRef = useRef(null);
  const modifiedScrollRef = useRef(null);
  const isScrollingRef = useRef(false);
  
  // Update current modified code when props change
  useEffect(() => {
    setCurrentModifiedCode(modifiedCode);
  }, [modifiedCode]);
  
  // Preserve original base code reference
  useEffect(() => {
    originalBaseCodeRef.current = originalCode;
  }, [originalCode]);

  // Handle synchronized scrolling between split view panes
  const handleSyncScroll = useCallback((source, scrollTop, scrollLeft) => {
    if (isScrollingRef.current) return;
    
    isScrollingRef.current = true;
    
    if (source === 'original' && modifiedScrollRef.current) {
      const viewport = modifiedScrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = scrollTop;
        viewport.scrollLeft = scrollLeft;
      }
    } else if (source === 'modified' && originalScrollRef.current) {
      const viewport = originalScrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = scrollTop;
        viewport.scrollLeft = scrollLeft;
      }
    }
    
    setTimeout(() => {
      isScrollingRef.current = false;
    }, 50);
  }, []);

  // Set up scroll event listeners for synchronized scrolling
  useEffect(() => {
    const originalViewport = originalScrollRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    const modifiedViewport = modifiedScrollRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    
    const handleOriginalScroll = (e) => {
      handleSyncScroll('original', e.target.scrollTop, e.target.scrollLeft);
    };
    
    const handleModifiedScroll = (e) => {
      handleSyncScroll('modified', e.target.scrollTop, e.target.scrollLeft);
    };
    
    if (originalViewport) {
      originalViewport.addEventListener('scroll', handleOriginalScroll);
    }
    
    if (modifiedViewport) {
      modifiedViewport.addEventListener('scroll', handleModifiedScroll);
    }
    
    return () => {
      if (originalViewport) {
        originalViewport.removeEventListener('scroll', handleOriginalScroll);
      }
      if (modifiedViewport) {
        modifiedViewport.removeEventListener('scroll', handleModifiedScroll);
      }
    };
  }, [handleSyncScroll, selectedView]);

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

  // Handle preview functionality
  const handlePreview = useCallback(async () => {
    setPreviewStatus({ loading: true, error: null, url: null });
    
    try {
      // Extract component name from file name or code
      const componentName = extractComponentName(fileName, currentModifiedCode);
      
      // Get store ID from context or props (assuming it's available)
      const storeId = '157d4590-49bf-4b0b-bd77-abe131909528'; // TODO: Get this from context/props
      
      // Resolve page URL
      const urlResult = await resolvePageURL(componentName, storeId);
      
      // Create temporary API endpoint to serve the modified code
      // This would typically involve:
      // 1. Creating a temporary file or memory cache with the modified code
      // 2. Setting up a temporary route to serve this modified version
      // 3. Opening the resolved URL with the temporary code applied
      
      if (urlResult.success || urlResult.fallback) {
        // For now, we'll open the URL in a new tab
        // In a full implementation, you'd want to:
        // 1. Send the modified code to a preview API endpoint
        // 2. Get back a preview URL that serves the modified version
        // 3. Open that preview URL
        
        const previewUrl = urlResult.url + '?preview=true&patch=' + encodeURIComponent(btoa(currentModifiedCode));
        window.open(previewUrl, '_blank', 'width=1200,height=800');
        
        setPreviewStatus({ 
          loading: false, 
          error: null, 
          url: previewUrl 
        });
      } else {
        throw new Error('Could not resolve page URL');
      }
      
    } catch (error) {
      console.error('Preview error:', error);
      setPreviewStatus({ 
        loading: false, 
        error: error.message || 'Failed to generate preview', 
        url: null 
      });
      
      // Reset error after 3 seconds
      setTimeout(() => {
        setPreviewStatus(prev => ({ ...prev, error: null }));
      }, 3000);
    }
  }, [fileName, currentModifiedCode]);

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

  // Notify parent when diff stats change
  useEffect(() => {
    if (onDiffStatsChange) {
      onDiffStatsChange(diffResult.stats);
    }
  }, [diffResult.stats, onDiffStatsChange]);

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

  const copyDiff = async () => {
    try {
      setCopyStatus({ copied: false, error: null });
      
      if (!diffResult.unifiedDiff || diffResult.unifiedDiff.trim() === '') {
        setCopyStatus({ copied: false, error: 'No diff content to copy' });
        setTimeout(() => setCopyStatus({ copied: false, error: null }), 3000);
        return;
      }

      await navigator.clipboard.writeText(diffResult.unifiedDiff);
      setCopyStatus({ copied: true, error: null });
      
      // Reset the copied status after 2 seconds
      setTimeout(() => {
        setCopyStatus({ copied: false, error: null });
      }, 2000);
    } catch (error) {
      console.error('Failed to copy diff:', error);
      setCopyStatus({ copied: false, error: 'Failed to copy to clipboard' });
      
      // Reset error status after 3 seconds
      setTimeout(() => setCopyStatus({ copied: false, error: null }), 3000);
    }
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
      <div className={`flex items-center px-2 py-1 text-sm font-mono min-w-max ${getLineStyle()}`}>
        {lineNumbers && (
          <>
            <div className="w-12 text-muted-foreground text-right pr-2 flex-shrink-0">
              {line.lineNumber || ''}
            </div>
            <div className="w-12 text-muted-foreground text-right pr-2 flex-shrink-0">
              {line.newLineNumber || ''}
            </div>
          </>
        )}
        
        <div className="w-6 flex items-center justify-center flex-shrink-0">
          {getLineIcon()}
        </div>
        
        <div className="pl-2 whitespace-nowrap">
          {line.type === 'modification' ? (
            <div className="space-y-1">
              <div className="text-red-600 line-through whitespace-nowrap">
                {line.originalContent}
              </div>
              <div className="text-green-600 whitespace-nowrap">
                {line.content}
              </div>
            </div>
          ) : (
            <span className={`whitespace-nowrap ${
              line.type === 'addition' ? 'text-green-600' :
              line.type === 'deletion' ? 'text-red-600' :
              'text-foreground'
            }`}>
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
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={copyDiff}
              className={`transition-all duration-200 ${
                copyStatus.copied 
                  ? 'bg-green-50 border-green-200 text-green-700' 
                  : copyStatus.error 
                    ? 'bg-red-50 border-red-200 text-red-700'
                    : ''
              }`}
              disabled={!diffResult.unifiedDiff || diffResult.unifiedDiff.trim() === ''}
            >
              {copyStatus.copied ? (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-1" />
                  Copy
                </>
              )}
            </Button>
            
            <Button variant="outline" size="sm" onClick={exportDiff}>
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
            
            <Button 
              variant="default" 
              size="sm" 
              onClick={handlePreview}
              className={`transition-all duration-200 ${
                previewStatus.loading 
                  ? 'bg-blue-50 border-blue-200 text-blue-700' 
                  : previewStatus.error 
                    ? 'bg-red-50 border-red-200 text-red-700'
                    : ''
              }`}
              disabled={previewStatus.loading || !currentModifiedCode}
            >
              {previewStatus.loading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                  Opening...
                </>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Preview
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Error Alerts */}
      {copyStatus.error && (
        <Alert className="mx-4 mb-2 border-red-200 bg-red-50">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {copyStatus.error}
          </AlertDescription>
        </Alert>
      )}
      
      {previewStatus.error && (
        <Alert className="mx-4 mb-2 border-red-200 bg-red-50">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Preview Error: {previewStatus.error}
          </AlertDescription>
        </Alert>
      )}

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
              <ScrollArea className="flex-1 w-full h-full overflow-auto" type="always">
                <div className="min-w-max w-fit">
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
                </div>
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
                <div className={`${(diffResult.stats.additions > 0 || diffResult.stats.deletions > 0) ? 'border-r' : ''} flex flex-col`}>
                  <div className="border-b p-2 bg-red-50">
                    <h4 className="font-medium text-red-900">Original ({originalBaseCodeRef.current.split('\n').length} lines)</h4>
                  </div>
                  {(diffResult.stats.additions > 0 || diffResult.stats.deletions > 0) ? (
                    <ScrollArea 
                      className="flex-1 w-full h-full overflow-auto" 
                      type="always"
                      ref={originalScrollRef}
                    >
                      <div className="min-w-max w-fit">
                        <SplitViewPane
                          lines={originalBaseCodeRef.current.split('\n')}
                          diffLines={displayLines}
                          side="original"
                          showLineNumbers={lineNumbers}
                          showWhitespace={showWhitespace}
                          onLineRevert={handleLineRevert}
                          originalLines={originalBaseCodeRef.current.split('\n')}
                          modifiedLines={currentModifiedCode.split('\n')}
                        />
                      </div>
                    </ScrollArea>
                  ) :
                      <pre className="p-4 text-sm font-mono whitespace-pre">
                          No modifications
                      </pre>
                  }
                </div>
                <div className="flex flex-col">
                  <div className="border-b p-2 bg-green-50 flex justify-between items-center">
                    <h4 className="font-medium text-green-900">Modified ({currentModifiedCode.split('\n').length} lines)</h4>
                  </div>
                   {(diffResult.stats.additions > 0 || diffResult.stats.deletions > 0) ? (
                      <ScrollArea 
                        className="flex-1 w-full h-full overflow-auto" 
                        type="always"
                        ref={modifiedScrollRef}
                      >
                        <div className="min-w-max w-fit">
                          <SplitViewPane
                            lines={currentModifiedCode.split('\n')}
                            diffLines={displayLines}
                            side="modified"
                            showLineNumbers={lineNumbers}
                            showWhitespace={showWhitespace}
                            onLineRevert={handleLineRevert}
                            originalLines={originalBaseCodeRef.current.split('\n')}
                            modifiedLines={currentModifiedCode.split('\n')}
                          />
                        </div>
                      </ScrollArea>
                   ) :
                       <pre className="p-4 text-sm font-mono whitespace-pre">
                          No modifications
                      </pre>
                  }
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
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={copyDiff}
                    className={`transition-all duration-200 ${
                      copyStatus.copied 
                        ? 'bg-green-50 text-green-700' 
                        : copyStatus.error 
                          ? 'bg-red-50 text-red-700'
                          : ''
                    }`}
                    disabled={!diffResult.unifiedDiff || diffResult.unifiedDiff.trim() === ''}
                    title={copyStatus.error || (copyStatus.copied ? 'Copied!' : 'Copy to clipboard')}
                  >
                    {copyStatus.copied ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                </div>
              </div>
              <ScrollArea className="flex-1 w-full h-full overflow-auto" type="always">
                <div className="min-w-max w-fit">
                  <pre className="p-4 text-sm font-mono whitespace-pre">
                    {diffResult.unifiedDiff || 'No differences to display'}
                  </pre>
                </div>
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