import React, { useState, useEffect, useMemo } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Eye, 
  Code, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  RefreshCw,
  Zap,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { applyPatch, createPatch } from 'diff';

const StorefrontPreview = ({ 
  patches = [], 
  originalCode = '', 
  onPatchToggle, 
  previewMode = 'visual',
  className = '' 
}) => {
  const [selectedPatches, setSelectedPatches] = useState(new Set());
  const [previewCode, setPreviewCode] = useState('');
  const [expandedPatches, setExpandedPatches] = useState(new Set());
  const [patchErrors, setPatchErrors] = useState(new Map());

  // Apply selected patches to generate preview code
  const appliedCode = useMemo(() => {
    let code = originalCode;
    const errors = new Map();
    
    patches.forEach((patch, index) => {
      if (selectedPatches.has(index)) {
        try {
          if (patch.type === 'json-patch' && patch.operations) {
            // Apply JSON patch operations (for complex AST modifications)
            code = applyJsonPatchOperations(code, patch.operations);
          } else if (patch.type === 'unified-diff' && patch.diff) {
            // Apply unified diff (for line-based changes)
            const result = applyPatch(code, patch.diff);
            if (result === false) {
              throw new Error('Failed to apply unified diff');
            }
            code = result;
          } else if (patch.changes) {
            // Apply simple line changes
            code = applyLineChanges(code, patch.changes);
          }
        } catch (error) {
          errors.set(index, error.message);
        }
      }
    });
    
    setPatchErrors(errors);
    return code;
  }, [originalCode, patches, selectedPatches]);

  useEffect(() => {
    setPreviewCode(appliedCode);
  }, [appliedCode]);

  const handlePatchToggle = (patchIndex) => {
    const newSelected = new Set(selectedPatches);
    if (newSelected.has(patchIndex)) {
      newSelected.delete(patchIndex);
    } else {
      newSelected.add(patchIndex);
    }
    setSelectedPatches(newSelected);
    onPatchToggle && onPatchToggle(Array.from(newSelected));
  };

  const togglePatchExpansion = (patchIndex) => {
    const newExpanded = new Set(expandedPatches);
    if (newExpanded.has(patchIndex)) {
      newExpanded.delete(patchIndex);
    } else {
      newExpanded.add(patchIndex);
    }
    setExpandedPatches(newExpanded);
  };

  const applyJsonPatchOperations = (code, operations) => {
    // Simplified JSON patch application for demo purposes
    // In a real implementation, this would use a proper JSON patch library
    // and work with parsed AST structures
    let modifiedCode = code;
    
    operations.forEach(op => {
      if (op.op === 'replace' && op.path && op.value) {
        // Simple string replacement for demo
        const pathSegments = op.path.split('/').filter(Boolean);
        if (pathSegments.length > 0) {
          const target = pathSegments[pathSegments.length - 1];
          modifiedCode = modifiedCode.replace(
            new RegExp(`${target}\\s*:\\s*['"][^'"]*['"]`, 'g'),
            `${target}: "${op.value}"`
          );
        }
      }
    });
    
    return modifiedCode;
  };

  const applyLineChanges = (code, changes) => {
    const lines = code.split('\n');
    
    changes.forEach(change => {
      if (change.type === 'replace' && change.line !== undefined) {
        const lineIndex = change.line - 1;
        if (lineIndex >= 0 && lineIndex < lines.length) {
          lines[lineIndex] = change.content;
        }
      } else if (change.type === 'insert' && change.line !== undefined) {
        const lineIndex = change.line - 1;
        lines.splice(lineIndex, 0, change.content);
      } else if (change.type === 'delete' && change.line !== undefined) {
        const lineIndex = change.line - 1;
        if (lineIndex >= 0 && lineIndex < lines.length) {
          lines.splice(lineIndex, 1);
        }
      }
    });
    
    return lines.join('\n');
  };

  const PatchItem = ({ patch, index }) => {
    const isSelected = selectedPatches.has(index);
    const isExpanded = expandedPatches.has(index);
    const hasError = patchErrors.has(index);

    return (
      <Card className={`p-4 ${isSelected ? 'ring-2 ring-blue-500' : ''} ${hasError ? 'border-red-500' : ''}`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => handlePatchToggle(index)}
              className="mt-1"
            />
            
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h4 className="font-medium">{patch.name || `Patch ${index + 1}`}</h4>
                <Badge variant={patch.type === 'json-patch' ? 'default' : 'secondary'}>
                  {patch.type}
                </Badge>
                {hasError && (
                  <Badge variant="destructive">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Error
                  </Badge>
                )}
              </div>
              
              {patch.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {patch.description}
                </p>
              )}

              {hasError && (
                <Alert className="mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {patchErrors.get(index)}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => togglePatchExpansion(index)}
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-4 space-y-3">
            {patch.changes && (
              <div>
                <h5 className="font-medium text-sm mb-2">Changes:</h5>
                <ScrollArea className="h-32">
                  <pre className="text-xs bg-muted p-2 rounded">
                    {JSON.stringify(patch.changes, null, 2)}
                  </pre>
                </ScrollArea>
              </div>
            )}

            {patch.operations && (
              <div>
                <h5 className="font-medium text-sm mb-2">Operations:</h5>
                <ScrollArea className="h-32">
                  <pre className="text-xs bg-muted p-2 rounded">
                    {JSON.stringify(patch.operations, null, 2)}
                  </pre>
                </ScrollArea>
              </div>
            )}

            {patch.diff && (
              <div>
                <h5 className="font-medium text-sm mb-2">Diff:</h5>
                <ScrollArea className="h-32">
                  <pre className="text-xs bg-muted p-2 rounded font-mono">
                    {patch.diff}
                  </pre>
                </ScrollArea>
              </div>
            )}
          </div>
        )}
      </Card>
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center">
          <Eye className="w-5 h-5 mr-2" />
          Storefront Preview
        </h3>
        
        <div className="flex items-center space-x-2">
          <Badge variant="outline">
            {selectedPatches.size} / {patches.length} patches applied
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedPatches(new Set());
              setExpandedPatches(new Set());
            }}
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Reset
          </Button>
        </div>
      </div>

      <Tabs value={previewMode} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="visual" className="flex items-center">
            <Eye className="w-4 h-4 mr-1" />
            Visual
          </TabsTrigger>
          <TabsTrigger value="code" className="flex items-center">
            <Code className="w-4 h-4 mr-1" />
            Code
          </TabsTrigger>
          <TabsTrigger value="patches" className="flex items-center">
            <FileText className="w-4 h-4 mr-1" />
            Patches
          </TabsTrigger>
        </TabsList>

        <TabsContent value="visual" className="mt-4">
          <Card className="p-6">
            <div className="text-center text-muted-foreground">
              <Zap className="w-8 h-8 mx-auto mb-2" />
              <p>Visual preview will render the applied changes</p>
              <p className="text-sm mt-1">
                {selectedPatches.size > 0 
                  ? `Showing preview with ${selectedPatches.size} patches applied`
                  : 'No patches selected for preview'
                }
              </p>
            </div>
            
            {/* This would contain the actual rendered preview */}
            {selectedPatches.size > 0 && (
              <div className="mt-4 p-4 bg-muted rounded">
                <p className="text-sm font-medium mb-2">Applied Code Preview:</p>
                <ScrollArea className="h-64">
                  <pre className="text-xs">{previewCode}</pre>
                </ScrollArea>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="code" className="mt-4">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium">Generated Code</h4>
              <Badge variant="outline">
                {previewCode.split('\n').length} lines
              </Badge>
            </div>
            
            <ScrollArea className="h-96">
              <pre className="text-sm bg-muted p-4 rounded font-mono">
                {previewCode || originalCode}
              </pre>
            </ScrollArea>
          </Card>
        </TabsContent>

        <TabsContent value="patches" className="mt-4">
          <div className="space-y-3">
            {patches.length === 0 ? (
              <Card className="p-8 text-center">
                <FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">No patches available</p>
              </Card>
            ) : (
              patches.map((patch, index) => (
                <PatchItem key={index} patch={patch} index={index} />
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StorefrontPreview;