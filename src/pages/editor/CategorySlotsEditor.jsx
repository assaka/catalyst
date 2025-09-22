/**
 * Clean CategorySlotsEditor - Simplified layout version
 */

import React from "react";
import PropTypes from 'prop-types';
import EditorSidebar from "@/components/editor/slot/EditorSidebar";
import PublishPanel from "@/components/editor/slot/PublishPanel";
import {
  AddSlotModal,
  ResetLayoutModal,
  FilePickerModalWrapper,
  CodeModal
} from '@/components/editor/slot/SlotComponents';
import CategoryEditorHeader from '@/components/editor/CategoryEditorHeader';
import CategoryEditorToolbar from '@/components/editor/CategoryEditorToolbar';
import { CategoryEditorLayout, CategoryEditorContent } from '@/components/editor/CategoryEditorLayout';
import CategoryContentRenderer from '@/components/editor/CategoryContentRenderer';
import { useCategoryEditor } from '@/hooks/useCategoryEditor';

const CategorySlotsEditor = ({
  mode = 'edit',
  onSave,
  viewMode: propViewMode = 'grid'
}) => {
  const editor = useCategoryEditor({ mode, onSave, viewMode: propViewMode });

  const renderSidebar = () => {
    if (mode !== 'edit' || editor.showPreview || !editor.isSidebarVisible || !editor.selectedElement) {
      return null;
    }

    const slotId = editor.selectedElement?.getAttribute?.('data-slot-id');
    const slotConfig = editor.categoryLayoutConfig?.slots?.[slotId] || null;

    return (
      <EditorSidebar
        selectedElement={editor.selectedElement}
        slotId={slotId}
        slotConfig={slotConfig}
        onTextChange={editor.handleTextChange}
        onClassChange={editor.handleClassChange}
        onInlineClassChange={editor.handleClassChange}
        onClearSelection={() => {
          editor.setSelectedElement(null);
          editor.setIsSidebarVisible(false);
        }}
        isVisible={true}
      />
    );
  };

  const renderModals = () => (
    <>
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
    </>
  );

  return (
    <CategoryEditorLayout
      isSidebarVisible={editor.isSidebarVisible}
      showPreview={editor.showPreview}
      currentViewport={editor.currentViewport}
      sidebar={renderSidebar()}
      modals={renderModals()}
    >
      {/* Header */}
      <CategoryEditorHeader
        mode={mode}
        viewMode={editor.viewMode}
        onViewModeChange={editor.setViewMode}
        localSaveStatus={editor.localSaveStatus}
        publishStatus={editor.publishStatus}
        saveConfiguration={editor.saveConfiguration}
        onPublish={editor.handlePublish}
        canPublish={editor.canPublish}
        showPreview={editor.showPreview}
        onTogglePreview={() => editor.setShowPreview(!editor.showPreview)}
        hasUnsavedChanges={editor.hasUnsavedChanges}
        showPublishPanel={editor.showPublishPanel}
        onTogglePublishPanel={editor.setShowPublishPanel}
        onClosePublishPanel={() => {
          editor.setIsSidebarVisible(false);
          editor.setSelectedElement(null);
        }}
      />

      {/* Toolbar */}
      <CategoryEditorToolbar
        showPreview={editor.showPreview}
        draftConfig={editor.draftConfig}
        latestPublished={editor.latestPublished}
        formatTimeAgo={editor.formatTimeAgo}
        currentViewport={editor.currentViewport}
        onViewportChange={editor.setCurrentViewport}
        showSlotBorders={editor.showSlotBorders}
        onToggleBorders={() => editor.setShowSlotBorders(!editor.showSlotBorders)}
        onResetLayout={() => editor.setShowResetModal(true)}
        onShowCode={() => editor.setShowCodeModal(true)}
        onAddSlot={() => editor.setShowAddSlotModal(true)}
      />

      {/* Content */}
      <CategoryEditorContent
        showPreview={editor.showPreview}
        currentViewport={editor.currentViewport}
      >
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
      </CategoryEditorContent>
    </CategoryEditorLayout>
  );
};

CategorySlotsEditor.propTypes = {
  mode: PropTypes.string,
  onSave: PropTypes.func,
  viewMode: PropTypes.string
};

export default CategorySlotsEditor;