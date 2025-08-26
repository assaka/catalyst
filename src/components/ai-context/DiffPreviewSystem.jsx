import React, { useState, useEffect, useMemo } from 'react';
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
  Zap
} from 'lucide-react';

const DiffPreviewSystem = ({ 
  patches = [], 
  originalCode = '', 
  modifiedCode = '',
  className = '' 
}) => {
  const [selectedView, setSelectedView] = useState('unified');
  const [lineNumbers, setLineNumbers] = useState(true);
  const [contextLines, setContextLines] = useState(3);

  // Calculate line-by-line diff
  const diffData = useMemo(() => {
    if (!originalCode && !modifiedCode) {
      return { lines: [], stats: { additions: 0, deletions: 0, changes: 0 } };
    }

    const originalLines = originalCode.split('\n');
    const modifiedLines = modifiedCode.split('\n');
    
    // Simple line-by-line diff algorithm
    const diff = calculateLineDiff(originalLines, modifiedLines);
    const stats = calculateStats(diff);
    
    return { lines: diff, stats };
  }, [originalCode, modifiedCode]);

  const calculateLineDiff = (original, modified) => {
    const result = [];
    const maxLength = Math.max(original.length, modified.length);
    
    for (let i = 0; i < maxLength; i++) {
      const originalLine = original[i];
      const modifiedLine = modified[i];
      
      if (originalLine === undefined) {
        // Line added
        result.push({
          type: 'addition',
          lineNumber: null,
          newLineNumber: i + 1,
          content: modifiedLine,
          originalContent: null
        });
      } else if (modifiedLine === undefined) {
        // Line deleted
        result.push({
          type: 'deletion',
          lineNumber: i + 1,
          newLineNumber: null,
          content: originalLine,
          originalContent: originalLine
        });
      } else if (originalLine !== modifiedLine) {
        // Line changed
        result.push({
          type: 'modification',
          lineNumber: i + 1,
          newLineNumber: i + 1,
          content: modifiedLine,
          originalContent: originalLine
        });
      } else {
        // Line unchanged
        result.push({
          type: 'context',
          lineNumber: i + 1,
          newLineNumber: i + 1,
          content: originalLine,
          originalContent: originalLine
        });
      }
    }
    
    return result;
  };

  const calculateStats = (diffLines) => {
    const stats = { additions: 0, deletions: 0, changes: 0 };
    
    diffLines.forEach(line => {
      switch (line.type) {
        case 'addition':
          stats.additions++;
          break;
        case 'deletion':
          stats.deletions++;
          break;
        case 'modification':
          stats.changes++;
          break;
      }
    });
    
    return stats;
  };

  const generateUnifiedDiff = () => {
    let diff = `--- Original\n+++ Modified\n`;
    let hunkStart = 0;
    let hunkLines = [];
    
    diffData.lines.forEach((line, index) => {
      if (line.type === 'context') {
        hunkLines.push(` ${line.content}`);
      } else if (line.type === 'deletion') {
        hunkLines.push(`-${line.content}`);
      } else if (line.type === 'addition') {
        hunkLines.push(`+${line.content}`);
      } else if (line.type === 'modification') {
        hunkLines.push(`-${line.originalContent}`);
        hunkLines.push(`+${line.content}`);
      }
    });
    
    if (hunkLines.length > 0) {
      diff += `@@ -1,${originalCode.split('\n').length} +1,${modifiedCode.split('\n').length} @@\n`;
      diff += hunkLines.join('\n');
    }
    
    return diff;
  };

  const copyDiff = () => {
    const unifiedDiff = generateUnifiedDiff();
    navigator.clipboard.writeText(unifiedDiff);
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
                +{diffData.stats.additions}
              </div>
              <div className="flex items-center text-red-600">
                <Minus className="w-3 h-3 mr-1" />
                -{diffData.stats.deletions}
              </div>
              <div className="flex items-center text-yellow-600">
                <ArrowRight className="w-3 h-3 mr-1" />
                ~{diffData.stats.changes}
              </div>
            </div>
            
            <Separator orientation="vertical" className="h-6" />
            
            <Button variant="outline" size="sm" onClick={copyDiff}>
              <Copy className="w-4 h-4 mr-1" />
              Copy
            </Button>
            
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        <Tabs value={selectedView} onValueChange={setSelectedView} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="unified">Unified Diff</TabsTrigger>
            <TabsTrigger value="split">Split View</TabsTrigger>
            <TabsTrigger value="patches">Patches</TabsTrigger>
          </TabsList>

          <TabsContent value="unified" className="flex-1 m-0">
            <div className="h-full flex flex-col">
              {/* Controls */}
              <div className="border-b p-2 bg-muted/50">
                <div className="flex items-center space-x-4 text-sm">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={lineNumbers}
                      onChange={(e) => setLineNumbers(e.target.checked)}
                    />
                    <span>Show line numbers</span>
                  </label>
                  
                  <div className="flex items-center space-x-2">
                    <span>Context lines:</span>
                    <select
                      value={contextLines}
                      onChange={(e) => setContextLines(Number(e.target.value))}
                      className="px-2 py-1 border rounded"
                    >
                      <option value={1}>1</option>
                      <option value={3}>3</option>
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Diff Content */}
              <ScrollArea className="flex-1">
                {diffData.lines.length === 0 ? (
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
                    {diffData.lines.map((line, index) => (
                      <DiffLine key={index} line={line} index={index} />
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="split" className="flex-1 m-0">
            <div className="h-full grid grid-cols-2">
              <div className="border-r">
                <div className="border-b p-2 bg-red-50">
                  <h4 className="font-medium text-red-900">Original</h4>
                </div>
                <ScrollArea className="h-full">
                  <pre className="p-4 text-sm font-mono whitespace-pre-wrap">
                    {originalCode || 'No original code'}
                  </pre>
                </ScrollArea>
              </div>
              
              <div>
                <div className="border-b p-2 bg-green-50">
                  <h4 className="font-medium text-green-900">Modified</h4>
                </div>
                <ScrollArea className="h-full">
                  <pre className="p-4 text-sm font-mono whitespace-pre-wrap">
                    {modifiedCode || 'No modified code'}
                  </pre>
                </ScrollArea>
              </div>
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