/**
 * Preview System Component
 * Allows users to preview changes before creating a release
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Eye, 
  Play, 
  Save, 
  GitBranch,
  ArrowRight,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Code2,
  Package
} from 'lucide-react';

import hookSystem from '@/core/HookSystem.js';
import eventSystem from '@/core/EventSystem.js';

const PreviewSystem = ({ 
  changes = [], 
  storeId,
  onPreview,
  onPublish,
  className = '' 
}) => {
  const [previewState, setPreviewState] = useState('idle'); // idle, previewing, ready, publishing
  const [previewResults, setPreviewResults] = useState([]);
  const [validationResults, setValidationResults] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [livePreviewUrl, setLivePreviewUrl] = useState(null);

  // Apply hooks to preview data
  const processedChanges = hookSystem.apply('preview.processChanges', changes, { storeId });

  // Group changes by file
  const groupedChanges = processedChanges.reduce((groups, change) => {
    const filePath = change.filePath || change.fileName;
    if (!groups[filePath]) {
      groups[filePath] = [];
    }
    groups[filePath].push(change);
    return groups;
  }, {});

  // Handle preview generation
  const handleStartPreview = useCallback(async () => {
    setPreviewState('previewing');
    
    try {
      // Apply preview hooks
      const shouldPreview = hookSystem.apply('preview.beforeStart', true, {
        changes: processedChanges,
        storeId
      });
      
      if (!shouldPreview) {
        setPreviewState('idle');
        return;
      }

      // Emit preview start event
      eventSystem.emit('preview.started', { changes: processedChanges, storeId });

      const results = [];
      const validations = [];

      // Process each file
      for (const [filePath, fileChanges] of Object.entries(groupedChanges)) {
        try {
          // Generate preview for this file
          const previewResult = await generateFilePreview(filePath, fileChanges);
          results.push(previewResult);

          // Validate changes
          const validation = await validateFileChanges(filePath, fileChanges);
          validations.push(validation);

        } catch (error) {
          console.error(`Preview error for ${filePath}:`, error);
          results.push({
            filePath,
            success: false,
            error: error.message
          });
        }
      }

      setPreviewResults(results);
      setValidationResults(validations);

      // Generate live preview URL
      const previewUrl = await generateLivePreview(processedChanges, storeId);
      setLivePreviewUrl(previewUrl);

      setPreviewState('ready');

      // Apply after preview hooks
      hookSystem.do('preview.afterGenerated', {
        results,
        validations,
        previewUrl,
        changes: processedChanges
      });

      // Emit preview ready event
      eventSystem.emit('preview.ready', {
        results,
        validations,
        previewUrl,
        changes: processedChanges
      });

    } catch (error) {
      console.error('Preview generation failed:', error);
      setPreviewState('idle');
      
      eventSystem.emit('preview.failed', {
        error: error.message,
        changes: processedChanges
      });
    }
  }, [processedChanges, storeId, groupedChanges]);

  // Generate preview for a single file
  const generateFilePreview = async (filePath, fileChanges) => {
    // Apply extensions to preview generation
    const customPreview = hookSystem.apply('preview.generateFilePreview', null, {
      filePath,
      changes: fileChanges,
      storeId
    });

    if (customPreview) {
      return customPreview;
    }

    // Default preview generation
    return {
      filePath,
      success: true,
      originalCode: fileChanges[0]?.originalCode || '',
      modifiedCode: fileChanges[fileChanges.length - 1]?.modifiedCode || '',
      changesSummary: fileChanges.map(c => c.description || 'Code modification'),
      linesChanged: calculateLinesChanged(fileChanges),
      status: 'ready'
    };
  };

  // Validate file changes
  const validateFileChanges = async (filePath, fileChanges) => {
    const validation = {
      filePath,
      valid: true,
      warnings: [],
      errors: [],
      suggestions: []
    };

    // Apply validation hooks
    const customValidation = hookSystem.apply('preview.validateFileChanges', validation, {
      filePath,
      changes: fileChanges,
      storeId
    });

    return customValidation;
  };

  // Generate live preview URL
  const generateLivePreview = async (changes, storeId) => {
    try {
      const previewData = {
        changes,
        storeId,
        timestamp: Date.now(),
        previewId: `preview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

      // Apply hooks to preview URL generation
      const customUrl = hookSystem.apply('preview.generateLiveUrl', null, {
        previewData,
        storeId
      });

      if (customUrl) {
        return customUrl;
      }

      // Default preview URL generation
      const baseUrl = process.env.REACT_APP_PREVIEW_BASE_URL || window.location.origin;
      const params = new URLSearchParams({
        preview: 'true',
        storeId,
        previewId: previewData.previewId,
        timestamp: previewData.timestamp
      });

      return `${baseUrl}/preview?${params.toString()}`;

    } catch (error) {
      console.error('Failed to generate preview URL:', error);
      return null;
    }
  };

  // Calculate lines changed
  const calculateLinesChanged = (fileChanges) => {
    let totalLines = 0;
    for (const change of fileChanges) {
      if (change.linesChanged) {
        totalLines += change.linesChanged;
      } else if (change.originalCode && change.modifiedCode) {
        const originalLines = change.originalCode.split('\n').length;
        const modifiedLines = change.modifiedCode.split('\n').length;
        totalLines += Math.abs(modifiedLines - originalLines);
      }
    }
    return totalLines;
  };

  // Handle publish
  const handlePublish = useCallback(async () => {
    if (previewState !== 'ready') return;

    setPreviewState('publishing');

    try {
      // Apply pre-publish hooks
      const shouldPublish = hookSystem.apply('preview.beforePublish', true, {
        changes: processedChanges,
        previewResults,
        validationResults,
        storeId
      });

      if (!shouldPublish) {
        setPreviewState('ready');
        return;
      }

      // Emit publish start event
      eventSystem.emit('preview.publishStarted', {
        changes: processedChanges,
        previewResults,
        validationResults
      });

      // Call parent publish handler
      if (onPublish) {
        await onPublish({
          changes: processedChanges,
          previewResults,
          validationResults,
          previewUrl: livePreviewUrl
        });
      }

      // Apply after publish hooks
      hookSystem.do('preview.afterPublish', {
        changes: processedChanges,
        previewResults,
        validationResults
      });

      // Emit publish success event
      eventSystem.emit('preview.publishCompleted', {
        changes: processedChanges,
        previewResults
      });

    } catch (error) {
      console.error('Publish failed:', error);
      setPreviewState('ready');
      
      eventSystem.emit('preview.publishFailed', {
        error: error.message,
        changes: processedChanges
      });
    }
  }, [previewState, processedChanges, previewResults, validationResults, storeId, onPublish, livePreviewUrl]);

  // Get overall validation status
  const getValidationStatus = () => {
    const errors = validationResults.reduce((sum, v) => sum + v.errors.length, 0);
    const warnings = validationResults.reduce((sum, v) => sum + v.warnings.length, 0);
    
    if (errors > 0) return { status: 'error', count: errors, type: 'errors' };
    if (warnings > 0) return { status: 'warning', count: warnings, type: 'warnings' };
    return { status: 'valid', count: 0, type: 'valid' };
  };

  const validationStatus = getValidationStatus();
  const canPublish = previewState === 'ready' && validationStatus.status !== 'error';

  return (
    <Card className={`${className}`}>
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Eye className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="font-medium">Preview Changes</h3>
              <p className="text-sm text-muted-foreground">
                {Object.keys(groupedChanges).length} files, {processedChanges.length} changes
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {previewState === 'idle' && (
              <Button onClick={handleStartPreview} disabled={processedChanges.length === 0}>
                <Play className="w-4 h-4 mr-2" />
                Generate Preview
              </Button>
            )}
            
            {previewState === 'previewing' && (
              <Button disabled>
                <Clock className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </Button>
            )}
            
            {previewState === 'ready' && (
              <div className="flex items-center space-x-2">
                {livePreviewUrl && (
                  <Button
                    variant="outline"
                    onClick={() => window.open(livePreviewUrl, '_blank')}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Live Preview
                  </Button>
                )}
                
                <Button 
                  onClick={handlePublish}
                  disabled={!canPublish}
                  className={canPublish ? "bg-green-600 hover:bg-green-700" : ""}
                >
                  <Package className="w-4 h-4 mr-2" />
                  Publish Release
                </Button>
              </div>
            )}
            
            {previewState === 'publishing' && (
              <Button disabled>
                <Clock className="w-4 h-4 mr-2 animate-spin" />
                Publishing...
              </Button>
            )}
          </div>
        </div>
      </div>

      {previewState !== 'idle' && (
        <div className="p-4">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="files">Files ({Object.keys(groupedChanges).length})</TabsTrigger>
              <TabsTrigger value="validation">
                Validation
                {validationStatus.status === 'error' && (
                  <Badge variant="destructive" className="ml-2">
                    {validationStatus.count} errors
                  </Badge>
                )}
                {validationStatus.status === 'warning' && (
                  <Badge variant="outline" className="ml-2">
                    {validationStatus.count} warnings
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium">{Object.keys(groupedChanges).length}</p>
                      <p className="text-sm text-muted-foreground">Files Modified</p>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-4">
                  <div className="flex items-center space-x-2">
                    <Code2 className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium">{processedChanges.length}</p>
                      <p className="text-sm text-muted-foreground">Total Changes</p>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-4">
                  <div className="flex items-center space-x-2">
                    {validationStatus.status === 'valid' ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : validationStatus.status === 'warning' ? (
                      <Clock className="w-5 h-5 text-yellow-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                    <div>
                      <p className="font-medium">
                        {validationStatus.status === 'valid' ? 'Valid' : 
                         validationStatus.status === 'warning' ? 'Warnings' : 'Errors'}
                      </p>
                      <p className="text-sm text-muted-foreground">Validation Status</p>
                    </div>
                  </div>
                </Card>
              </div>

              {livePreviewUrl && (
                <Card className="p-4 bg-blue-50 border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-blue-900">Live Preview Ready</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Your changes are ready to preview in a live environment
                      </p>
                    </div>
                    <Button 
                      onClick={() => window.open(livePreviewUrl, '_blank')}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Open Preview
                    </Button>
                  </div>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="files">
              <div className="space-y-3">
                {Object.entries(groupedChanges).map(([filePath, fileChanges]) => {
                  const result = previewResults.find(r => r.filePath === filePath);
                  return (
                    <Card key={filePath} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <Code2 className="w-4 h-4 text-gray-600" />
                            <span className="font-mono text-sm">{filePath}</span>
                            <Badge variant="outline">{fileChanges.length} changes</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {fileChanges.map(c => c.description || 'Code modification').join(', ')}
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {result?.success ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : result?.success === false ? (
                            <XCircle className="w-5 h-5 text-red-600" />
                          ) : (
                            <Clock className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="validation">
              <div className="space-y-3">
                {validationResults.map((validation, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-sm">{validation.filePath}</span>
                          {validation.valid ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-600" />
                          )}
                        </div>
                        
                        {validation.errors.length > 0 && (
                          <div className="mt-2">
                            <h5 className="text-sm font-medium text-red-700">Errors:</h5>
                            <ul className="text-sm text-red-600 mt-1 space-y-1">
                              {validation.errors.map((error, i) => (
                                <li key={i}>• {error}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {validation.warnings.length > 0 && (
                          <div className="mt-2">
                            <h5 className="text-sm font-medium text-yellow-700">Warnings:</h5>
                            <ul className="text-sm text-yellow-600 mt-1 space-y-1">
                              {validation.warnings.map((warning, i) => (
                                <li key={i}>• {warning}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {validation.suggestions.length > 0 && (
                          <div className="mt-2">
                            <h5 className="text-sm font-medium text-blue-700">Suggestions:</h5>
                            <ul className="text-sm text-blue-600 mt-1 space-y-1">
                              {validation.suggestions.map((suggestion, i) => (
                                <li key={i}>• {suggestion}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </Card>
  );
};

export default PreviewSystem;