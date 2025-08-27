/**
 * Inline Preview Pane
 * Loads preview content without redirecting, tests patch application,
 * and provides detailed feedback on patch status
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle, XCircle, RefreshCw, Eye, Code, Bug } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const InlinePreviewPane = ({
  fileName,
  filePath,
  modifiedCode,
  originalCode,
  storeId = '157d4590-49bf-4b0b-bd77-abe131909528'
}) => {
  // State management
  const [previewMode, setPreviewMode] = useState('visual'); // 'visual', 'code', 'patches'
  const [previewStatus, setPreviewStatus] = useState({
    loading: false,
    error: null,
    patchesApplied: 0,
    hasBaseline: false,
    patchDetails: []
  });
  const [previewContent, setPreviewContent] = useState('');
  const [patchTestResults, setPatchTestResults] = useState(null);
  const iframeRef = useRef(null);

  /**
   * Test patch application without redirecting
   */
  const testPatchApplication = useCallback(async () => {
    try {
      console.log('🧪 Testing patch application for:', filePath);
      
      // Test if patches can be applied using the dedicated test endpoint
      const response = await fetch(`/api/patches/test/${encodeURIComponent(filePath)}?store_id=${storeId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });

      const result = await response.json();
      
      if (result.success) {
        setPatchTestResults({
          success: true,
          hasPatches: result.data.hasPatches,
          appliedPatches: result.data.appliedPatches,
          totalPatches: result.data.totalPatches,
          patchDetails: result.data.patchDetails || [],
          baselineCode: result.data.baselineCode,
          patchedCode: result.data.patchedCode,
          mode: result.data.mode
        });
        
        console.log('✅ Patch test successful:', {
          hasPatches: result.data.hasPatches,
          appliedPatches: result.data.appliedPatches
        });
        
        return result;
      } else {
        throw new Error(result.error || 'Failed to test patches');
      }
    } catch (error) {
      console.error('❌ Patch test failed:', error);
      setPatchTestResults({
        success: false,
        error: error.message,
        hasPatches: false
      });
      throw error;
    }
  }, [filePath, storeId]);

  /**
   * Load preview content inline without redirecting
   */
  const loadInlinePreview = useCallback(async () => {
    setPreviewStatus({ loading: true, error: null, patchesApplied: 0, hasBaseline: false, patchDetails: [] });
    
    try {
      // First test patch application
      const patchResult = await testPatchApplication();
      
      // Update preview status
      setPreviewStatus({
        loading: false,
        error: null,
        patchesApplied: patchResult.data.appliedPatches,
        hasBaseline: !!patchResult.data.baselineCode,
        patchDetails: patchResult.data.patchDetails || []
      });
      
      // Set preview content based on mode
      if (previewMode === 'code') {
        setPreviewContent(patchResult.data.patchedCode || patchResult.data.baselineCode || modifiedCode);
      } else if (previewMode === 'visual') {
        // For visual preview, we'll create a data URL with the content
        await loadVisualPreview(patchResult.data.patchedCode || patchResult.data.baselineCode || modifiedCode);
      }

    } catch (error) {
      console.error('❌ Preview load failed:', error);
      setPreviewStatus({
        loading: false,
        error: error.message,
        patchesApplied: 0,
        hasBaseline: false,
        patchDetails: []
      });
    }
  }, [previewMode, testPatchApplication, modifiedCode]);

  /**
   * Load visual preview in iframe using data URL
   */
  const loadVisualPreview = useCallback(async (codeContent) => {
    if (!iframeRef.current || !codeContent) return;

    try {
      // Detect file type and create appropriate preview
      const fileExt = fileName.split('.').pop().toLowerCase();
      let previewHTML = '';

      if (['jsx', 'tsx', 'js'].includes(fileExt)) {
        // React component preview
        previewHTML = createReactPreview(codeContent);
      } else if (fileExt === 'html') {
        // HTML preview
        previewHTML = codeContent;
      } else if (fileExt === 'css') {
        // CSS preview
        previewHTML = createCSSPreview(codeContent);
      } else if (fileExt === 'json') {
        // JSON preview
        previewHTML = createJSONPreview(codeContent);
      } else {
        // Text/code preview
        previewHTML = createTextPreview(codeContent, fileExt);
      }

      // Load content into iframe using data URL
      const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(previewHTML)}`;
      iframeRef.current.src = dataUrl;

    } catch (error) {
      console.error('❌ Visual preview error:', error);
      setPreviewStatus(prev => ({
        ...prev,
        error: `Visual preview failed: ${error.message}`
      }));
    }
  }, [fileName]);

  /**
   * Create React component preview HTML
   */
  const createReactPreview = (code) => {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Component Preview</title>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
          margin: 0; 
          padding: 20px; 
          background: #f8fafc;
        }
        .preview-container { 
          background: white;
          border: 1px solid #e1e5e9; 
          border-radius: 8px; 
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .code-preview {
          background: #f1f5f9;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          padding: 16px;
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 14px;
          line-height: 1.5;
          overflow-x: auto;
          white-space: pre-wrap;
        }
        .preview-header {
          background: #1e293b;
          color: white;
          padding: 12px 16px;
          border-radius: 6px 6px 0 0;
          font-weight: 500;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="preview-container">
        <div class="preview-header">React Component Preview</div>
        <div class="code-preview">${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
        <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e1e5e9; color: #64748b; font-size: 14px;">
          <strong>Note:</strong> This is a code preview. A full React compilation would require a build system.
        </div>
      </div>
    </body>
    </html>
    `;
  };

  /**
   * Create CSS preview HTML
   */
  const createCSSPreview = (css) => {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>CSS Preview</title>
      <style>
        ${css}
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 20px; }
        .css-preview-demo { padding: 20px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <h1>CSS Preview</h1>
      <div class="css-preview-demo">
        <h2>Demo Content</h2>
        <p>Your CSS styles are applied to this preview content.</p>
        <button>Sample Button</button>
        <div class="container">
          <span class="highlight">Highlighted text</span>
        </div>
      </div>
    </body>
    </html>
    `;
  };

  /**
   * Create JSON preview HTML
   */
  const createJSONPreview = (json) => {
    try {
      const parsed = JSON.parse(json);
      const formatted = JSON.stringify(parsed, null, 2);
      
      return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>JSON Preview</title>
        <style>
          body { font-family: Monaco, Menlo, monospace; margin: 20px; background: #f8fafc; }
          .json-container { background: white; border: 1px solid #e1e5e9; border-radius: 8px; padding: 20px; }
          pre { margin: 0; font-size: 14px; line-height: 1.5; overflow-x: auto; }
        </style>
      </head>
      <body>
        <div class="json-container">
          <h3 style="margin-top: 0;">JSON Preview</h3>
          <pre>${formatted}</pre>
        </div>
      </body>
      </html>
      `;
    } catch (error) {
      return createTextPreview(json, 'json');
    }
  };

  /**
   * Create text/code preview HTML
   */
  const createTextPreview = (content, type) => {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${type.toUpperCase()} Preview</title>
      <style>
        body { 
          font-family: Monaco, Menlo, monospace; 
          margin: 20px; 
          background: #f8fafc; 
          font-size: 14px;
          line-height: 1.6;
        }
        .content-container { 
          background: white; 
          border: 1px solid #e1e5e9; 
          border-radius: 8px; 
          padding: 20px; 
        }
        pre { 
          margin: 0; 
          white-space: pre-wrap; 
          word-wrap: break-word; 
        }
      </style>
    </head>
    <body>
      <div class="content-container">
        <h3 style="margin-top: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
          ${type.toUpperCase()} File Preview
        </h3>
        <pre>${content}</pre>
      </div>
    </body>
    </html>
    `;
  };

  // Load preview when component mounts or dependencies change
  useEffect(() => {
    if (fileName && filePath) {
      loadInlinePreview();
    }
  }, [fileName, filePath, modifiedCode, previewMode, loadInlinePreview]);

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Inline Preview
          </CardTitle>
          <div className="flex items-center gap-2">
            {previewStatus.loading && (
              <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadInlinePreview}
              disabled={previewStatus.loading}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Patch Status Banner */}
        <div className="flex flex-wrap gap-2 mt-2">
          {previewStatus.hasBaseline && (
            <Badge variant="outline" className="text-green-700">
              <CheckCircle className="h-3 w-3 mr-1" />
              Baseline Found
            </Badge>
          )}
          {previewStatus.patchesApplied > 0 && (
            <Badge variant="secondary">
              {previewStatus.patchesApplied} Patches Applied
            </Badge>
          )}
          {patchTestResults?.success && (
            <Badge variant="default" className="bg-blue-100 text-blue-700">
              <CheckCircle className="h-3 w-3 mr-1" />
              Patches Valid
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Error Display */}
        {previewStatus.error && (
          <Alert variant="destructive" className="mb-4">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Preview Error:</strong> {previewStatus.error}
            </AlertDescription>
          </Alert>
        )}

        {/* Patch Test Results */}
        {patchTestResults && (
          <Alert className={`mb-4 ${patchTestResults.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
            <div className="flex items-start gap-2">
              {patchTestResults.success ? (
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="font-medium text-sm">
                  Patch Application Test: {patchTestResults.success ? 'Passed' : 'Failed'}
                </div>
                {patchTestResults.success && (
                  <div className="text-sm text-muted-foreground mt-1">
                    {patchTestResults.hasPatches 
                      ? `${patchTestResults.appliedPatches}/${patchTestResults.totalPatches} patches applied successfully`
                      : 'No patches found (showing baseline code)'}
                  </div>
                )}
                {!patchTestResults.success && (
                  <div className="text-sm text-red-600 mt-1">
                    {patchTestResults.error}
                  </div>
                )}
              </div>
            </div>
          </Alert>
        )}

        {/* Preview Tabs */}
        <Tabs value={previewMode} onValueChange={setPreviewMode}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="visual" className="text-sm">
              <Eye className="h-4 w-4 mr-1" />
              Visual
            </TabsTrigger>
            <TabsTrigger value="code" className="text-sm">
              <Code className="h-4 w-4 mr-1" />
              Code
            </TabsTrigger>
            <TabsTrigger value="patches" className="text-sm">
              <Bug className="h-4 w-4 mr-1" />
              Patches
            </TabsTrigger>
          </TabsList>

          {/* Visual Preview Tab */}
          <TabsContent value="visual" className="mt-0">
            <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
              <div className="bg-gray-50 px-3 py-2 text-sm text-gray-600 border-b">
                Visual Preview - {fileName}
              </div>
              <div className="relative" style={{ height: '400px' }}>
                {previewStatus.loading ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto text-blue-500 mb-2" />
                      <p className="text-sm text-gray-500">Loading preview...</p>
                    </div>
                  </div>
                ) : (
                  <iframe
                    ref={iframeRef}
                    className="w-full h-full border-0"
                    title="Preview"
                    sandbox="allow-scripts allow-same-origin"
                  />
                )}
              </div>
            </div>
          </TabsContent>

          {/* Code Preview Tab */}
          <TabsContent value="code" className="mt-0">
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-3 py-2 text-sm text-gray-600 border-b">
                Code Preview - {fileName}
              </div>
              <div className="p-4 max-h-96 overflow-y-auto">
                <pre className="text-sm bg-gray-50 p-3 rounded border overflow-x-auto">
                  <code>{previewContent || 'Loading code preview...'}</code>
                </pre>
              </div>
            </div>
          </TabsContent>

          {/* Patches Debug Tab */}
          <TabsContent value="patches" className="mt-0">
            <div className="space-y-3">
              {previewStatus.patchDetails.length > 0 ? (
                previewStatus.patchDetails.map((patch, index) => (
                  <div key={index} className="border rounded-lg p-3 bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-sm">{patch.name}</div>
                      <Badge variant={patch.changeType === 'manual_edit' ? 'default' : 'secondary'} className="text-xs">
                        {patch.changeType}
                      </Badge>
                    </div>
                    {patch.releaseVersion && (
                      <div className="text-xs text-gray-500 mb-1">
                        Release: {patch.releaseVersion}
                      </div>
                    )}
                    <div className="text-xs text-gray-600">
                      Priority: {patch.priority}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Bug className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>No patches found for this file</p>
                  <p className="text-sm">The preview shows the baseline code</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default InlinePreviewPane;