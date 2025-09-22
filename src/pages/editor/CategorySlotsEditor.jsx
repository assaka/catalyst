/**
 * Clean CategorySlotsEditor - Simplified and modular version
 */

import React from "react";
import PropTypes from 'prop-types';
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import EditorSidebar from "@/components/editor/slot/EditorSidebar";
import PublishPanel from "@/components/editor/slot/PublishPanel";
import {
  EditorToolbar,
  AddSlotModal,
  ResetLayoutModal,
  FilePickerModalWrapper,
  EditModeControls,
  CodeModal,
  PublishPanelToggle,
  TimestampsRow,
  ResponsiveContainer
} from '@/components/editor/slot/SlotComponents';
import CategoryViewModeControls from '@/components/editor/CategoryViewModeControls';
import CategoryContentRenderer from '@/components/editor/CategoryContentRenderer';
import { useCategoryEditor } from '@/hooks/useCategoryEditor';

const CategorySlotsEditor = ({
  mode = 'edit',
  onSave,
  viewMode: propViewMode = 'grid'
}) => {
  // Use the custom hook for all editor logic
  const editor = useCategoryEditor({ mode, onSave, viewMode: propViewMode });

  return (
    <div className={`min-h-screen bg-gray-50 ${editor.isSidebarVisible ? 'pr-80' : ''}`}>
      {/* Main Editor Area */}
      <div className="flex flex-col h-screen">
        {/* Editor Header */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center justify-between gap-4">
              {/* View Mode Tabs */}
              <CategoryViewModeControls
                viewMode={editor.viewMode}
                onViewModeChange={editor.setViewMode}
              />

              {/* Edit mode controls */}
              {mode === 'edit' && (
                <EditModeControls
                  localSaveStatus={editor.localSaveStatus}
                  publishStatus={editor.publishStatus}
                  saveConfiguration={editor.saveConfiguration}
                  onPublish={editor.handlePublish}
                  hasChanges={editor.canPublish}
                />
              )}
            </div>

            {/* Preview and Publish Buttons */}
            <div className="flex items-center gap-2">
              <Button
                onClick={() => editor.setShowPreview(!editor.showPreview)}
                variant={editor.showPreview ? "default" : "outline"}
                size="sm"
                className="flex items-center gap-1.5"
                title={editor.showPreview ? "Exit Preview" : "Preview without editing tools"}
              >
                <Eye className="w-4 h-4" />
                {editor.showPreview ? "Exit Preview" : "Preview"}
              </Button>

              <PublishPanelToggle
                hasUnsavedChanges={editor.hasUnsavedChanges}
                showPublishPanel={editor.showPublishPanel}
                onTogglePublishPanel={editor.setShowPublishPanel}
                onClosePublishPanel={() => {
                  editor.setIsSidebarVisible(false);
                  editor.setSelectedElement(null);
                }}
              />
            </div>
          </div>
        </div>

        {/* Category Layout */}
        <div className="bg-gray-50 category-page flex-1 overflow-y-auto">
          {/* Timestamps Row */}
          <TimestampsRow
            draftConfig={editor.draftConfig}
            latestPublished={editor.latestPublished}
            formatTimeAgo={editor.formatTimeAgo}
            currentViewport={editor.currentViewport}
            onViewportChange={editor.setCurrentViewport}
          />

          {!editor.showPreview && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <EditorToolbar
                showSlotBorders={editor.showSlotBorders}
                onToggleBorders={() => editor.setShowSlotBorders(!editor.showSlotBorders)}
                onResetLayout={() => editor.setShowResetModal(true)}
                onShowCode={() => editor.setShowCodeModal(true)}
                onAddSlot={() => editor.setShowAddSlotModal(true)}
              />
            </div>
          )}

          <ResponsiveContainer viewport={editor.currentViewport} className="bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
              <CategoryContentRenderer
                categoryLayoutConfig={editor.categoryLayoutConfig}
                viewMode={editor.viewMode}
                mockCategoryContext={editor.mockCategoryContext}
                showPreview={editor.showPreview}
                mode={mode}
                showSlotBorders={editor.showSlotBorders}
                currentDragInfo={editor.currentDragInfo}
                setCurrentDragInfo={editor.setCurrentDragInfo}
                onElementClick={editor.handleElementClick}
                onGridResize={editor.handleGridResize}
                onSlotHeightResize={editor.handleSlotHeightResize}
                onSlotDrop={editor.handleSlotDrop}
                onSlotDelete={editor.handleSlotDelete}
                onResizeStart={() => editor.setIsResizing(true)}
                onResizeEnd={() => {
                  editor.lastResizeEndTime.current = Date.now();
                  setTimeout(() => editor.setIsResizing(false), 100);
                }}
                selectedElement={editor.selectedElement}
                setPageConfig={editor.setCategoryLayoutConfig}
                saveConfiguration={editor.saveConfiguration}
                saveTimeoutRef={editor.saveTimeoutRef}
              />
            </div>
          </ResponsiveContainer>
        </div>
      </div>

      {/* EditorSidebar */}
      {mode === 'edit' && !editor.showPreview && editor.isSidebarVisible && editor.selectedElement && (
        <EditorSidebar
          selectedElement={editor.selectedElement}
          slotId={editor.selectedElement?.getAttribute?.('data-slot-id')}
          slotConfig={(() => {
            const slotId = editor.selectedElement?.getAttribute?.('data-slot-id');
            return editor.categoryLayoutConfig?.slots?.[slotId] || null;
          })()}
          onTextChange={editor.handleTextChange}
          onClassChange={editor.handleClassChange}
          onInlineClassChange={editor.handleClassChange}
          onClearSelection={() => {
            editor.setSelectedElement(null);
            editor.setIsSidebarVisible(false);
          }}
          isVisible={true}
        />
      )}

      {/* Modals */}
      <AddSlotModal
        isOpen={editor.showAddSlotModal}
        onClose={() => editor.setShowAddSlotModal(false)}
        onCreateSlot={editor.handleCreateSlot}
        onShowFilePicker={() => editor.setShowFilePickerModal(true)}
      />

      <FilePickerModalWrapper
        isOpen={editor.showFilePickerModal}
        onClose={() => editor.setShowFilePickerModal(false)}
        onCreateSlot={editor.handleCreateSlot}
        fileType="image"
      />

      <ResetLayoutModal
        isOpen={editor.showResetModal}
        onClose={() => editor.setShowResetModal(false)}
        onConfirm={editor.handleResetLayout}
        isResetting={editor.localSaveStatus === 'saving'}
      />

      <CodeModal
        isOpen={editor.showCodeModal}
        onClose={() => editor.setShowCodeModal(false)}
        configuration={editor.categoryLayoutConfig}
        localSaveStatus={editor.localSaveStatus}
        onSave={async (newConfiguration) => {
          editor.setCategoryLayoutConfig(newConfiguration);
          await editor.saveConfiguration(newConfiguration);
          editor.setShowCodeModal(false);
        }}
      />

      {/* Floating Publish Panel */}
      {editor.showPublishPanel && (
        <div ref={editor.publishPanelRef} className="fixed top-20 right-6 z-50 w-80">
          <PublishPanel
            draftConfig={editor.draftConfig}
            storeId={editor.getSelectedStoreId()}
            pageType="category"
            onPublished={editor.handlePublishPanelPublished}
            onReverted={editor.handlePublishPanelReverted}
            hasUnsavedChanges={editor.hasUnsavedChanges}
          />
        </div>
      )}
    </div>
  );
};

CategorySlotsEditor.propTypes = {
  mode: PropTypes.string,
  onSave: PropTypes.func,
  viewMode: PropTypes.string
};

export default CategorySlotsEditor;