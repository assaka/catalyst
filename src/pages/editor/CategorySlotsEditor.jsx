/**
 * CategorySlotsEditor - Mirror of Category.jsx layout with editing capabilities
 */

import React from "react";
import PropTypes from 'prop-types';
import EditorSidebar from "@/components/editor/slot/EditorSidebar";
import PublishPanel from "@/components/editor/slot/PublishPanel";
import {
  AddSlotModal,
  ResetLayoutModal,
  FilePickerModalWrapper,
  CodeModal,
  EditorToolbar,
  EditModeControls,
  PublishPanelToggle,
  TimestampsRow,
  HierarchicalSlotRenderer
} from '@/components/editor/slot/SlotComponents';
import CategoryViewModeControls from '@/components/editor/CategoryViewModeControls';
import { CategorySlotRenderer } from '@/components/storefront/CategorySlotRenderer';
import { useCategoryEditor } from '@/hooks/useCategoryEditor';
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

const CategorySlotsEditor = ({
  mode = 'edit',
  onSave,
  viewMode: propViewMode = 'grid'
}) => {
  const editor = useCategoryEditor({ mode, onSave, viewMode: propViewMode });

  return (
    <>
      {/* Minimal Editor Header - only show when editing */}
      {mode === 'edit' && !editor.showPreview && (
        <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto py-3">
              <div className="flex flex-wrap items-center justify-between gap-4">
                {/* Left section */}
                <div className="flex items-center gap-6">
                  <CategoryViewModeControls
                    viewMode={editor.viewMode}
                    onViewModeChange={editor.setViewMode}
                  />

                  <EditModeControls
                    localSaveStatus={editor.localSaveStatus}
                    publishStatus={editor.publishStatus}
                    saveConfiguration={editor.saveConfiguration}
                    onPublish={editor.handlePublish}
                    hasChanges={editor.canPublish}
                  />
                </div>

                {/* Right section */}
                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => editor.setShowPreview(!editor.showPreview)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Preview
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

              {/* Timestamps and Editor Toolbar */}
              <div className="border-t border-gray-100 pt-3 mt-3">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <TimestampsRow
                    draftConfig={editor.draftConfig}
                    latestPublished={editor.latestPublished}
                    formatTimeAgo={editor.formatTimeAgo}
                    currentViewport={editor.currentViewport}
                    onViewportChange={editor.setCurrentViewport}
                  />

                  <EditorToolbar
                    showSlotBorders={editor.showSlotBorders}
                    onToggleBorders={() => editor.setShowSlotBorders(!editor.showSlotBorders)}
                    onResetLayout={() => editor.setShowResetModal(true)}
                    onShowCode={() => editor.setShowCodeModal(true)}
                    onAddSlot={() => editor.setShowAddSlotModal(true)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview mode header */}
      {editor.showPreview && (
        <div className="bg-blue-50 border-b border-blue-200 sticky top-0 z-40">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto py-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-700 font-medium">
                  Preview Mode - This is how your category page will look to customers
                </span>
                <Button
                  onClick={() => editor.setShowPreview(false)}
                  variant="outline"
                  size="sm"
                  className="border-blue-200 text-blue-700 hover:bg-blue-100"
                >
                  Exit Preview
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content - Scrollable container with fixed header */}
      <div
        className={`overflow-y-auto ${editor.isSidebarVisible && !editor.showPreview ? 'lg:pr-80' : ''} transition-all duration-300`}
        style={{
          height: mode === 'edit' && !editor.showPreview ? 'calc(100vh - 180px)' : '100vh'
        }}
      >
        <div className="px-4 sm:px-6 lg:px-8 py-8">
            <div className="max-w-7xl mx-auto">
              {editor.showPreview ? (
                // Pure preview mode - exactly like Category.jsx
                <CategorySlotRenderer
                  slots={editor.categoryLayoutConfig?.slots}
                  parentId={null}
                  viewMode={editor.viewMode}
                  categoryContext={editor.mockCategoryContext}
                />
              ) : (
                // Edit mode with overlay
                <div className="relative min-h-[800px]">
                  {/* Background content - CategorySlotRenderer */}
                  <div className="pointer-events-none">
                    <CategorySlotRenderer
                      slots={editor.categoryLayoutConfig?.slots}
                      parentId={null}
                      viewMode={editor.viewMode}
                      categoryContext={editor.mockCategoryContext}
                    />
                  </div>

                  {/* Overlay - HierarchicalSlotRenderer for editing */}
                  <div className="absolute inset-0 pointer-events-none">
                      <div className="grid grid-cols-12 gap-2 auto-rows-min h-full">
                        <HierarchicalSlotRenderer
                          slots={editor.categoryLayoutConfig?.slots || {}}
                          parentId={null}
                          mode={mode}
                          viewMode={editor.viewMode}
                          showBorders={editor.showSlotBorders}
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
                          selectedElementId={editor.selectedElement?.getAttribute?.('data-slot-id')}
                          setPageConfig={editor.setCategoryLayoutConfig}
                          saveConfiguration={editor.saveConfiguration}
                          saveTimeoutRef={editor.saveTimeoutRef}
                          customSlotRenderer={() => (
                            <div
                              className="w-full h-full bg-transparent pointer-events-auto"
                              style={{
                                minHeight: '20px',
                                border: editor.showSlotBorders ? '1px dashed rgba(59, 130, 246, 0.5)' : 'none'
                              }}
                            />
                          )}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

      {/* Editor Sidebar - Mobile overlay, desktop fixed */}
      {mode === 'edit' && !editor.showPreview && editor.isSidebarVisible && editor.selectedElement && (
        <>
          {/* Mobile backdrop */}
          <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => {
            editor.setSelectedElement(null);
            editor.setIsSidebarVisible(false);
          }} />

          {/* Sidebar - Independent scrolling */}
          <div
            className="fixed right-0 w-80 z-50 lg:z-40 overflow-y-auto bg-white shadow-lg"
            style={{
              top: mode === 'edit' && !editor.showPreview ? '180px' : '0px',
              height: mode === 'edit' && !editor.showPreview ? 'calc(100vh - 180px)' : '100vh'
            }}
          >
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
          </div>
        </>
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
    </>
  );
};

CategorySlotsEditor.propTypes = {
  mode: PropTypes.string,
  onSave: PropTypes.func,
  viewMode: PropTypes.string
};

export default CategorySlotsEditor;