import React from 'react';
import PropTypes from 'prop-types';
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { EditModeControls, PublishPanelToggle } from '@/components/editor/slot/SlotComponents';
import CategoryViewModeControls from '@/components/editor/CategoryViewModeControls';

const CategoryEditorHeader = ({
  mode,
  viewMode,
  onViewModeChange,
  localSaveStatus,
  publishStatus,
  saveConfiguration,
  onPublish,
  canPublish,
  showPreview,
  onTogglePreview,
  hasUnsavedChanges,
  showPublishPanel,
  onTogglePublishPanel,
  onClosePublishPanel
}) => {
  return (
    <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
      <div className="px-4 sm:px-6 py-3">
        {/* Mobile Layout */}
        <div className="flex flex-col space-y-3 sm:hidden">
          {/* Top Row - View Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">View:</span>
              <CategoryViewModeControls
                viewMode={viewMode}
                onViewModeChange={onViewModeChange}
              />
            </div>

            <Button
              onClick={onTogglePreview}
              variant={showPreview ? "default" : "outline"}
              size="sm"
              className="flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              <span className="hidden xs:inline">{showPreview ? "Exit Preview" : "Preview"}</span>
            </Button>
          </div>

          {/* Bottom Row - Edit Controls and Publish */}
          {mode === 'edit' && (
            <div className="flex items-center justify-between">
              <EditModeControls
                localSaveStatus={localSaveStatus}
                publishStatus={publishStatus}
                saveConfiguration={saveConfiguration}
                onPublish={onPublish}
                hasChanges={canPublish}
              />

              <PublishPanelToggle
                hasUnsavedChanges={hasUnsavedChanges}
                showPublishPanel={showPublishPanel}
                onTogglePublishPanel={onTogglePublishPanel}
                onClosePublishPanel={onClosePublishPanel}
              />
            </div>
          )}
        </div>

        {/* Desktop Layout */}
        <div className="hidden sm:flex items-center justify-between">
          {/* Left Section - View Controls and Edit Actions */}
          <div className="flex items-center space-x-6">
            {/* View Mode Controls */}
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-gray-700">View:</span>
              <CategoryViewModeControls
                viewMode={viewMode}
                onViewModeChange={onViewModeChange}
              />
            </div>

            {/* Edit Mode Controls */}
            {mode === 'edit' && (
              <div className="border-l border-gray-200 pl-6">
                <EditModeControls
                  localSaveStatus={localSaveStatus}
                  publishStatus={publishStatus}
                  saveConfiguration={saveConfiguration}
                  onPublish={onPublish}
                  hasChanges={canPublish}
                />
              </div>
            )}
          </div>

          {/* Right Section - Preview and Publish */}
          <div className="flex items-center space-x-3">
            <Button
              onClick={onTogglePreview}
              variant={showPreview ? "default" : "outline"}
              size="sm"
              className="flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              {showPreview ? "Exit Preview" : "Preview"}
            </Button>

            <PublishPanelToggle
              hasUnsavedChanges={hasUnsavedChanges}
              showPublishPanel={showPublishPanel}
              onTogglePublishPanel={onTogglePublishPanel}
              onClosePublishPanel={onClosePublishPanel}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

CategoryEditorHeader.propTypes = {
  mode: PropTypes.string.isRequired,
  viewMode: PropTypes.string.isRequired,
  onViewModeChange: PropTypes.func.isRequired,
  localSaveStatus: PropTypes.string.isRequired,
  publishStatus: PropTypes.string,
  saveConfiguration: PropTypes.func.isRequired,
  onPublish: PropTypes.func.isRequired,
  canPublish: PropTypes.bool.isRequired,
  showPreview: PropTypes.bool.isRequired,
  onTogglePreview: PropTypes.func.isRequired,
  hasUnsavedChanges: PropTypes.bool.isRequired,
  showPublishPanel: PropTypes.bool.isRequired,
  onTogglePublishPanel: PropTypes.func.isRequired,
  onClosePublishPanel: PropTypes.func.isRequired
};

export default CategoryEditorHeader;