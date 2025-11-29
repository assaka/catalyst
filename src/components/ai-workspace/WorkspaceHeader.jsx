import React, { useState, useEffect } from 'react';
import { useAIWorkspace, PAGE_TYPES, VIEWPORT_MODES } from '@/contexts/AIWorkspaceContext';
import { useStoreSelection } from '@/contexts/StoreSelectionContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  PanelLeftClose,
  PanelLeft,
  Save,
  Pencil,
  Eye,
  Loader2,
  Plug,
  ChevronDown,
  Package,
  Plus,
  Rocket,
  CheckCircle2
} from 'lucide-react';
import { slotEnabledFiles } from '@/components/editor/slot/slotEnabledFiles';
import apiClient from '@/api/client';
import slotConfigurationService from '@/services/slotConfigurationService';

/**
 * WorkspaceHeader - Header component for AI Workspace
 * Contains page selector, editor toggle, viewport controls, and save status
 */

const WorkspaceHeader = () => {
  const {
    selectedPageType,
    selectPage,
    editorMode,
    toggleEditorMode,
    hasUnsavedChanges,
    isLoading,
    aiPanelCollapsed,
    toggleAiPanel,
    showPluginEditor,
    pluginToEdit,
    openPluginEditor,
    closePluginEditor
  } = useAIWorkspace();

  const { getSelectedStoreId } = useStoreSelection();
  const [plugins, setPlugins] = useState([]);
  const [loadingPlugins, setLoadingPlugins] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [hasUnpublishedChanges, setHasUnpublishedChanges] = useState(false);

  const storeId = getSelectedStoreId();

  // Load user's plugins
  useEffect(() => {
    loadPlugins();
  }, []);

  // Check for unpublished changes on mount and when exiting editor
  useEffect(() => {
    checkUnpublishedChanges();
  }, [storeId, editorMode]);

  const checkUnpublishedChanges = async () => {
    if (!storeId) return;

    try {
      const pageTypes = Object.values(PAGE_TYPES);
      let hasChanges = false;

      for (const pageType of pageTypes) {
        try {
          const draftResponse = await slotConfigurationService.getDraftConfiguration(storeId, pageType);
          if (draftResponse?.data?.has_unpublished_changes) {
            hasChanges = true;
            break; // At least one page has unpublished changes
          }
        } catch (err) {
          // Ignore errors for individual page types
        }
      }

      setHasUnpublishedChanges(hasChanges);
    } catch (error) {
      console.error('Failed to check unpublished changes:', error);
    }
  };

  const loadPlugins = async () => {
    try {
      setLoadingPlugins(true);
      const response = await apiClient.get(`plugins/store/${storeId}`);
      if (response.success && response.plugins) {
        setPlugins(response.plugins);
      }
    } catch (error) {
      console.error('Failed to load plugins:', error);
    } finally {
      setLoadingPlugins(false);
    }
  };

  // Publish all draft configurations to production
  const handlePublish = async () => {
    if (!storeId || isPublishing) return;

    setIsPublishing(true);
    setPublishSuccess(false);

    try {
      // Get all page types that can be published
      const pageTypes = Object.values(PAGE_TYPES);
      const publishPromises = [];

      for (const pageType of pageTypes) {
        try {
          // First get the draft configuration to get its ID
          const draftResponse = await slotConfigurationService.getDraftConfiguration(storeId, pageType);

          if (draftResponse?.data?.id) {
            // Publish the draft directly to production
            publishPromises.push(
              slotConfigurationService.publishDraft(draftResponse.data.id, storeId)
                .catch(err => {
                  console.warn(`Failed to publish ${pageType}:`, err.message);
                  return null;
                })
            );
          }
        } catch (err) {
          console.warn(`No draft found for ${pageType}:`, err.message);
        }
      }

      // Wait for all publish operations
      await Promise.all(publishPromises);

      setPublishSuccess(true);
      setHasUnpublishedChanges(false);

      // Clear success indicator after 3 seconds
      setTimeout(() => setPublishSuccess(false), 3000);

    } catch (error) {
      console.error('Failed to publish configurations:', error);
    } finally {
      setIsPublishing(false);
    }
  };

  // Get the current page info
  const currentPage = slotEnabledFiles.find(f => f.pageType === selectedPageType);
  const PageIcon = currentPage?.icon;

  // Handle selecting a page from Editor dropdown
  const handleSelectPage = (pageType) => {
    selectPage(pageType);
    if (!editorMode) {
      toggleEditorMode();
    }
  };

  // Handle selecting a plugin from Plugins dropdown
  const handleSelectPlugin = (plugin) => {
    openPluginEditor(plugin);
  };

  return (
    <header className="h-14 border-b bg-white dark:bg-gray-800 flex items-center px-4 gap-4 shrink-0">
      {/* Left section: AI Panel toggle */}
      <div className="flex items-center gap-3">
        {/* AI Panel toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleAiPanel}
          className="h-8 w-8 p-0"
          title={aiPanelCollapsed ? 'Show AI Panel' : 'Hide AI Panel'}
        >
          {aiPanelCollapsed ? (
            <PanelLeft className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Center section: Title + Context info */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            AI Workspace
          </h1>
          {editorMode && currentPage && !showPluginEditor && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Editing: {currentPage.name}
            </p>
          )}
          {showPluginEditor && pluginToEdit && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Plugin: {pluginToEdit.name}
            </p>
          )}
          {!editorMode && !showPluginEditor && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Storefront Preview (Draft)
            </p>
          )}
        </div>
      </div>

      {/* Right section: Editor + Plugins buttons */}
      <div className="flex items-center gap-2">
        {/* Editor Dropdown */}
        {editorMode && !showPluginEditor ? (
          // In editor mode - show Exit Editor button + page selector
          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="default" size="sm" className="h-8 gap-1.5">
                  {PageIcon && <PageIcon className="h-3.5 w-3.5" />}
                  <span>{currentPage?.name || 'Page'}</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Select Page</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {slotEnabledFiles
                  .filter(file => !file.comingSoon)
                  .map((file) => {
                    const Icon = file.icon;
                    return (
                      <DropdownMenuItem
                        key={file.id}
                        onClick={() => selectPage(file.pageType)}
                        className={selectedPageType === file.pageType ? 'bg-gray-100' : ''}
                      >
                        <div className="flex items-center gap-2">
                          {Icon && <Icon className={`h-4 w-4 ${file.color}`} />}
                          <span>{file.name}</span>
                        </div>
                      </DropdownMenuItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleEditorMode}
              className="h-8 gap-1.5"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Exit Editor</span>
            </Button>
          </div>
        ) : !showPluginEditor ? (
          // Not in editor mode - show Editor dropdown
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1.5">
                <Pencil className="h-3.5 w-3.5" />
                <span>Editor</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Edit Page</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {slotEnabledFiles
                .filter(file => !file.comingSoon)
                .map((file) => {
                  const Icon = file.icon;
                  return (
                    <DropdownMenuItem
                      key={file.id}
                      onClick={() => handleSelectPage(file.pageType)}
                    >
                      <div className="flex items-center gap-2">
                        {Icon && <Icon className={`h-4 w-4 ${file.color}`} />}
                        <span>{file.name}</span>
                      </div>
                    </DropdownMenuItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}

        {/* Plugins Dropdown */}
        {showPluginEditor ? (
          // In plugin mode - show Exit Plugins button
          <Button
            variant="default"
            size="sm"
            onClick={closePluginEditor}
            className="h-8 gap-1.5 bg-purple-600 hover:bg-purple-700"
          >
            <Package className="h-3.5 w-3.5" />
            <span>Exit Plugins</span>
          </Button>
        ) : (
          // Not in plugin mode - show Plugins dropdown
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1.5">
                <Plug className="h-3.5 w-3.5" />
                <span>Plugins</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Your Plugins</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {loadingPlugins ? (
                <DropdownMenuItem disabled>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Loading...
                </DropdownMenuItem>
              ) : plugins.length === 0 ? (
                <DropdownMenuItem disabled>
                  <span className="text-gray-500">No plugins yet</span>
                </DropdownMenuItem>
              ) : (
                plugins.map((plugin) => (
                  <DropdownMenuItem
                    key={plugin.id}
                    onClick={() => handleSelectPlugin(plugin)}
                  >
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-purple-500" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm truncate">{plugin.name}</div>
                        <div className="text-xs text-gray-500 truncate">v{plugin.version}</div>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => {
                // Create new plugin via AI
                if (editorMode) toggleEditorMode();
              }}>
                <Plus className="h-4 w-4 mr-2 text-green-600" />
                <span>Create New Plugin</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Publish Button */}
        {!showPluginEditor && (
          <Button
            variant={publishSuccess || hasUnpublishedChanges ? 'default' : 'outline'}
            size="sm"
            className={
              publishSuccess
                ? 'h-8 gap-1.5 bg-green-600 hover:bg-green-700'
                : hasUnpublishedChanges
                  ? 'h-8 gap-1.5 bg-orange-500 hover:bg-orange-600'
                  : 'h-8 gap-1.5'
            }
            onClick={handlePublish}
            disabled={isPublishing}
            title={hasUnpublishedChanges ? 'You have unpublished changes' : 'Publish all draft changes to production'}
          >
            {isPublishing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : publishSuccess ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : (
              <Rocket className="h-3.5 w-3.5" />
            )}
            <span>{publishSuccess ? 'Published!' : hasUnpublishedChanges ? 'Publish Changes' : 'Publish'}</span>
          </Button>
        )}
      </div>
    </header>
  );
};

export default WorkspaceHeader;
