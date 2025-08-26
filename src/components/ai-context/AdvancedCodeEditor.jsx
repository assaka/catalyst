/**
 * Advanced Code Editor - Integration Component
 * Combines Monaco Editor with AST parsing, diff management, auto-save, overlay system, and version control
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Save, 
  History, 
  GitBranch, 
  Eye, 
  Code2, 
  Diff,
  Layers,
  Settings,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Zap
} from 'lucide-react';

// Import our custom components and services
import CodeEditor from './CodeEditor';
import PreviewPane from './PreviewPane';
import useAutoSave from '../../hooks/useAutoSave';
import { useVersionControl } from '../../services/version-control-service';
import { useAdvancedOverlayManager } from '../../hooks/useAdvancedOverlayManager';
import { astParser, astValidator } from '../../utils/ast-utils';
import DiffService from '../../services/diff-service';

const AdvancedCodeEditor = ({
  fileId,
  initialContent = '',
  fileName = 'untitled.js',
  language = 'javascript',
  onSave,
  onContentChange,
  onError,
  className = '',
  readOnly = false,
  enableVersionControl = true,
  enablePreview = true,
  enableAutoSave = true,
  enableAST = true,
  autoSaveDelay = 2000
}) => {
  // State management
  const [content, setContent] = useState(initialContent);
  const [activeTab, setActiveTab] = useState('editor');
  const [astData, setAstData] = useState(null);
  const [astErrors, setAstErrors] = useState([]);
  const [diffData, setDiffData] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Refs
  const monacoRef = useRef(null);
  const diffServiceRef = useRef(new DiffService());

  // Custom hooks for advanced features
  const {
    saveStatus,
    lastSaved,
    isOnline,
    forceSave,
    recoverOfflineContent,
    metadata: autoSaveMetadata
  } = useAutoSave({
    editorState: content,
    onSave: handleAutoSave,
    delay: autoSaveDelay,
    fileId,
    originalContent: initialContent,
    onError: handleAutoSaveError,
    onSaveSuccess: handleAutoSaveSuccess,
    config: {
      enableOfflineStorage: true,
      enableConflictDetection: true,
      compressionEnabled: true
    }
  });

  const {
    service: versionService,
    currentVersion,
    versionHistory,
    stats: versionStats,
    createVersion,
    revertToVersion,
    createBranch,
    switchToBranch,
    exportHistory
  } = useVersionControl(fileId, {
    maxVersions: 50,
    enableASTParsing: enableAST,
    enableAutoPatch: true
  });

  const {
    overlayManager,
    stats: overlayStats,
    syncStatus,
    lastSync,
    createOverlay,
    updateOverlay,
    removeOverlay,
    getMergedContent,
    setOriginalCode,
    loadOverlayFromDatabase,
    finalizeOverlay,
    syncAllOverlays
  } = useAdvancedOverlayManager({
    enableDatabaseSync: true,
    autoSave: true,
    autoSaveInterval: 5000, // 5 seconds for demo
    enableVersionControl: enableVersionControl,
    storeId: null, // Could be passed from parent component
    defaultTTL: 30 * 60 * 1000, // 30 minutes
    maxOverlaysPerFile: 3
  });

  /**
   * Initialize the editor and services
   */
  useEffect(() => {
    const initialize = async () => {
      try {
        // Initialize AST parser with Monaco
        if (enableAST && window.monaco) {
          await astParser.initialize(window.monaco);
        }

        // Initialize version control with initial content
        if (enableVersionControl && fileId && initialContent) {
          await versionService.createFile(fileId, initialContent, {
            language,
            fileName,
            message: 'Initial version'
          });
        }

        // Set original content for overlay system
        if (fileId && initialContent) {
          setOriginalCode(fileId, initialContent);

          // Try to load existing overlay from database
          try {
            const overlayResult = await loadOverlayFromDatabase(fileId);
            if (overlayResult.success && overlayResult.overlay) {
              console.log('Loaded overlay from database:', overlayResult.overlay.id);
              // Use the overlay content if it's more recent than initial content
              if (overlayResult.overlay.tmpCode !== initialContent) {
                setContent(overlayResult.overlay.tmpCode);
              }
            }
          } catch (error) {
            console.warn('Failed to load overlay from database:', error);
          }
        }

        // Check for offline recovery (this takes precedence over database)
        const recovered = recoverOfflineContent();
        if (recovered && recovered.isRecovered) {
          setContent(recovered.content);
          console.log('Recovered offline content from:', recovered.timestamp);
        }

        setIsInitialized(true);

      } catch (error) {
        console.error('Failed to initialize Advanced Code Editor:', error);
        if (onError) onError(error);
      }
    };

    initialize();
  }, [fileId, initialContent, language, fileName, enableAST, enableVersionControl]);

  /**
   * Update content when initialContent prop changes (for file switching)
   */
  useEffect(() => {
    if (initialContent !== content) {
      setContent(initialContent);
    }
  }, [initialContent]);

  /**
   * Handle content changes from Monaco Editor
   */
  const handleContentChange = useCallback(async (newContent) => {
    setContent(newContent);
    
    // Notify parent component
    if (onContentChange) {
      onContentChange(newContent, { 
        fileId, 
        timestamp: Date.now(),
        hasUnsavedChanges: newContent !== initialContent
      });
    }

    // Parse AST for real-time analysis
    if (enableAST && isInitialized) {
      try {
        const astResult = await astParser.parseToAST(newContent, language);
        if (astResult.success) {
          setAstData(astResult.ast);
          
          // Validate AST
          const validationErrors = astValidator.validateAST(astResult.ast);
          setAstErrors(validationErrors);
        } else {
          setAstErrors([{
            severity: 'error',
            message: astResult.error,
            type: 'parse_error'
          }]);
        }
      } catch (error) {
        console.warn('AST parsing failed:', error);
        setAstErrors([{
          severity: 'warning',
          message: 'AST parsing unavailable',
          type: 'parser_unavailable'
        }]);
      }
    }

    // Create overlay for preview
    if (fileId && newContent !== initialContent) {
      createOverlay(fileId, newContent, {
        priority: 1,
        metadata: { language, source: 'editor', timestamp: Date.now() }
      });
    }

    // Generate diff from original
    if (newContent !== initialContent) {
      const diffResult = diffServiceRef.current.createDiff(initialContent, newContent);
      setDiffData(diffResult);
    } else {
      setDiffData(null);
    }

  }, [fileId, initialContent, language, isInitialized, enableAST, createOverlay, onContentChange]);

  /**
   * Handle manual save
   */
  const handleManualSave = useCallback(async () => {
    try {
      if (onSave) {
        await onSave(content, { 
          fileId, 
          fileName, 
          timestamp: Date.now(),
          isManualSave: true 
        });
      }

      // Force auto-save to update
      await forceSave(content);

      // Create version if version control is enabled
      if (enableVersionControl && content !== initialContent) {
        await createVersion(content, {
          message: 'Manual save',
          author: 'user',
          isManualSave: true
        });
      }

      // Finalize any active overlays on manual save
      if (fileId && overlayStats?.local?.activeOverlays > 0) {
        try {
          const overlays = overlayManager.getFileOverlays(fileId);
          for (const overlay of overlays) {
            await finalizeOverlay(overlay.id);
          }
          console.log(`Finalized ${overlays.length} overlays on manual save`);
        } catch (error) {
          console.warn('Failed to finalize overlays:', error);
        }
      }

    } catch (error) {
      console.error('Manual save failed:', error);
      if (onError) onError(error);
    }
  }, [content, fileId, fileName, onSave, forceSave, enableVersionControl, createVersion, initialContent, onError]);

  /**
   * Auto-save handlers
   */
  async function handleAutoSave(content, metadata) {
    if (onSave) {
      await onSave(content, { ...metadata, isAutoSave: true });
    }
  }

  function handleAutoSaveError(error, context) {
    console.error('Auto-save error:', error);
    if (onError) onError(error, context);
  }

  function handleAutoSaveSuccess(result) {
    console.log('Auto-save successful:', result.timestamp);
  }

  /**
   * Handle version reversion
   */
  const handleRevertToVersion = useCallback(async (versionId) => {
    try {
      const revertedVersion = await revertToVersion(versionId, {
        message: `Reverted to version ${versionId}`,
        author: 'user'
      });
      
      setContent(revertedVersion.content);
      
      // Clear overlays since we're reverting
      overlayManager.clearFileOverlays(fileId);
      
    } catch (error) {
      console.error('Version revert failed:', error);
      if (onError) onError(error);
    }
  }, [revertToVersion, fileId, overlayManager, onError]);

  /**
   * Handle Monaco editor mount
   */
  const handleEditorDidMount = useCallback((editor, monaco) => {
    monacoRef.current = { editor, monaco };
    
    // Configure Monaco for our use case
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false
    });

    // Set up advanced features
    editor.addAction({
      id: 'save-file',
      label: 'Save File',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
      run: handleManualSave
    });

  }, [handleManualSave]);

  /**
   * Get status color based on various states
   */
  const getStatusColor = () => {
    if (astErrors.some(e => e.severity === 'error')) return 'destructive';
    if (saveStatus === 'error') return 'destructive';
    if (saveStatus === 'saving') return 'secondary';
    if (astErrors.some(e => e.severity === 'warning')) return 'outline';
    return 'secondary';
  };

  /**
   * Get status text
   */
  const getStatusText = () => {
    if (astErrors.some(e => e.severity === 'error')) return 'Syntax Error';
    if (saveStatus === 'saving') return 'Saving...';
    if (saveStatus === 'error') return 'Save Failed';
    if (!isOnline) return 'Offline';
    if (diffData && diffData.diff.length > 0) return 'Modified';
    return 'Ready';
  };

  return (
    <div className={`h-full flex flex-col bg-background ${className}`}>
      {/* Header with Status and Controls */}
      <div className="border-b p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Code2 className="w-5 h-5" />
            <span className="font-medium">{fileName}</span>
            <Badge variant={getStatusColor()} className="text-xs">
              {getStatusText()}
            </Badge>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Version Control Stats */}
            {enableVersionControl && versionStats.totalVersions > 0 && (
              <Badge variant="outline" className="text-xs">
                <History className="w-3 h-3 mr-1" />
                v{versionStats.totalVersions}
              </Badge>
            )}
            
            {/* Overlay Stats */}
            {overlayStats?.local?.activeOverlays > 0 && (
              <Badge variant="outline" className="text-xs">
                <Layers className="w-3 h-3 mr-1" />
                {overlayStats.local.activeOverlays}
                {overlayStats.database?.activeOverlays > 0 && 
                  `/${overlayStats.database.activeOverlays}`}
              </Badge>
            )}

            {/* Database Sync Status */}
            {syncStatus === 'syncing' && (
              <Badge variant="secondary" className="text-xs">
                <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                Syncing...
              </Badge>
            )}
            {syncStatus === 'error' && (
              <Badge variant="destructive" className="text-xs">
                <AlertCircle className="w-3 h-3 mr-1" />
                Sync Error
              </Badge>
            )}
            
            {/* Auto-save Status */}
            {enableAutoSave && (
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                {saveStatus === 'saving' ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : saveStatus === 'success' ? (
                  <CheckCircle2 className="w-3 h-3 text-green-600" />
                ) : saveStatus === 'error' ? (
                  <AlertCircle className="w-3 h-3 text-red-600" />
                ) : (
                  <Clock className="w-3 h-3" />
                )}
                {lastSaved ? `Saved ${lastSaved.toLocaleTimeString()}` : 'Not saved'}
              </div>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleManualSave}
              disabled={saveStatus === 'saving' || readOnly}
            >
              <Save className="w-4 h-4" />
            </Button>
            
            {/* Database Sync Button */}
            {overlayStats?.local?.activeOverlays > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  try {
                    await syncAllOverlays();
                    console.log('Manual sync completed');
                  } catch (error) {
                    console.error('Manual sync failed:', error);
                  }
                }}
                disabled={syncStatus === 'syncing'}
                title="Sync overlays to database"
              >
                <Zap className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="editor" className="text-xs">
              <Code2 className="w-3 h-3 mr-1" />
              Editor
            </TabsTrigger>
            <TabsTrigger value="preview" disabled={!enablePreview} className="text-xs">
              <Eye className="w-3 h-3 mr-1" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="diff" disabled={!diffData} className="text-xs">
              <Diff className="w-3 h-3 mr-1" />
              Changes
            </TabsTrigger>
            <TabsTrigger value="versions" disabled={!enableVersionControl} className="text-xs">
              <History className="w-3 h-3 mr-1" />
              History
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} className="h-full">
          {/* Editor Tab */}
          <TabsContent value="editor" className="h-full m-0 p-0">
            <CodeEditor
              value={content}
              onChange={handleContentChange}
              language={language}
              fileName={fileName}
              readOnly={readOnly}
              onMount={handleEditorDidMount}
              enableDiffDetection={true}
              originalCode={initialContent}
              className="h-full"
            />
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview" className="h-full m-0 p-0">
            {enablePreview ? (
              <PreviewPane
                fileId={fileId}
                originalContent={initialContent}
                overlayContent={content}
                language={language}
                autoRefresh={true}
                onError={onError}
                className="h-full"
              />
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                Preview disabled
              </div>
            )}
          </TabsContent>

          {/* Diff Tab */}
          <TabsContent value="diff" className="h-full m-0 p-0">
            <div className="h-full p-4">
              {diffData ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Changes</h3>
                    <div className="flex space-x-2">
                      <Badge variant="outline">
                        +{diffServiceRef.current.getDiffStats(diffData.diff)?.additions || 0}
                      </Badge>
                      <Badge variant="outline">
                        -{diffServiceRef.current.getDiffStats(diffData.diff)?.deletions || 0}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg overflow-auto max-h-96">
                    <pre className="p-4 text-sm">
                      {diffServiceRef.current.createUnifiedDiff(initialContent, content, fileName)}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No changes to display
                </div>
              )}
            </div>
          </TabsContent>

          {/* Version History Tab */}
          <TabsContent value="versions" className="h-full m-0 p-0">
            <div className="h-full p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Version History</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportHistory('json')}
                >
                  Export
                </Button>
              </div>
              
              <div className="space-y-2 max-h-96 overflow-auto">
                {versionHistory.length > 0 ? (
                  versionHistory.map((version) => (
                    <Card key={version.id} className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">
                              {version.id.substring(0, 8)}
                            </Badge>
                            <span className="text-sm">{version.message}</span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {new Date(version.timestamp).toLocaleString()} • {version.author}
                          </div>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRevertToVersion(version.id)}
                        >
                          Revert
                        </Button>
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    No version history available
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Status Bar */}
      <div className="border-t px-4 py-2 bg-muted/50 text-xs text-muted-foreground">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span>{content.length} chars</span>
            <span>{content.split('\n').length} lines</span>
            {astData && (
              <span>AST: {astData.body?.length || 0} nodes</span>
            )}
            {diffData && (
              <span>Modified: {diffServiceRef.current.getDiffStats(diffData.diff)?.additions || 0} additions</span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {astErrors.length > 0 && (
              <span className="text-red-600">
                {astErrors.filter(e => e.severity === 'error').length} errors,
                {astErrors.filter(e => e.severity === 'warning').length} warnings
              </span>
            )}
            {lastSync && (
              <span className="text-green-600">
                DB sync: {new Date(lastSync).toLocaleTimeString()}
              </span>
            )}
            <span>{language.toUpperCase()}</span>
            {!isOnline && <span className="text-orange-600">OFFLINE</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedCodeEditor;