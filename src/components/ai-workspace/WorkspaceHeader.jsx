import React from 'react';
import { useAIWorkspace, PAGE_TYPES, VIEWPORT_MODES } from '@/contexts/AIWorkspaceContext';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Monitor,
  Tablet,
  Smartphone,
  PanelLeftClose,
  PanelLeft,
  Save,
  Pencil,
  Eye,
  Loader2
} from 'lucide-react';
import { slotEnabledFiles } from '@/components/editor/slot/slotEnabledFiles';

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
    viewportMode,
    setViewportMode,
    hasUnsavedChanges,
    isLoading,
    aiPanelCollapsed,
    toggleAiPanel
  } = useAIWorkspace();

  // Get the current page info
  const currentPage = slotEnabledFiles.find(f => f.pageType === selectedPageType);
  const PageIcon = currentPage?.icon;

  return (
    <header className="h-14 border-b bg-white dark:bg-gray-800 flex items-center px-4 gap-4 shrink-0">
      {/* Left section: AI Panel toggle + Page Selector */}
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

        {/* Page Selector - visible when in editor mode */}
        {editorMode && (
          <Select value={selectedPageType} onValueChange={selectPage}>
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue>
                <div className="flex items-center gap-2">
                  {PageIcon && <PageIcon className={`h-4 w-4 ${currentPage?.color}`} />}
                  <span>{currentPage?.name || 'Select Page'}</span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {slotEnabledFiles
                .filter(file => !file.comingSoon)
                .map((file) => {
                  const Icon = file.icon;
                  return (
                    <SelectItem key={file.id} value={file.pageType}>
                      <div className="flex items-center gap-2">
                        {Icon && <Icon className={`h-4 w-4 ${file.color}`} />}
                        <span>{file.name}</span>
                      </div>
                    </SelectItem>
                  );
                })}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Center section: Title + Description */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            AI Workspace
          </h1>
          {editorMode && currentPage && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {currentPage.description}
            </p>
          )}
        </div>
      </div>

      {/* Right section: Viewport + Editor Toggle + Save */}
      <div className="flex items-center gap-2">
        {/* Viewport controls - visible in editor mode */}
        {editorMode && (
          <div className="flex items-center border rounded-md p-0.5 bg-gray-100 dark:bg-gray-700">
            <Button
              variant={viewportMode === VIEWPORT_MODES.DESKTOP ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setViewportMode(VIEWPORT_MODES.DESKTOP)}
              title="Desktop view"
            >
              <Monitor className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={viewportMode === VIEWPORT_MODES.TABLET ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setViewportMode(VIEWPORT_MODES.TABLET)}
              title="Tablet view"
            >
              <Tablet className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={viewportMode === VIEWPORT_MODES.MOBILE ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setViewportMode(VIEWPORT_MODES.MOBILE)}
              title="Mobile view"
            >
              <Smartphone className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}

        {/* Editor Mode Toggle */}
        <Button
          variant={editorMode ? 'default' : 'outline'}
          size="sm"
          onClick={toggleEditorMode}
          className="h-8 gap-1.5"
        >
          {editorMode ? (
            <>
              <Eye className="h-3.5 w-3.5" />
              <span>Preview</span>
            </>
          ) : (
            <>
              <Pencil className="h-3.5 w-3.5" />
              <span>Editor</span>
            </>
          )}
        </Button>

        {/* Save indicator */}
        {hasUnsavedChanges && (
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            <span>Save Draft</span>
          </Button>
        )}
      </div>
    </header>
  );
};

export default WorkspaceHeader;
