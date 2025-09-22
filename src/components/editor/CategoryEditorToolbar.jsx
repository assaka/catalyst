import React from 'react';
import PropTypes from 'prop-types';
import { EditorToolbar, TimestampsRow } from '@/components/editor/slot/SlotComponents';

const CategoryEditorToolbar = ({
  showPreview,
  draftConfig,
  latestPublished,
  formatTimeAgo,
  currentViewport,
  onViewportChange,
  showSlotBorders,
  onToggleBorders,
  onResetLayout,
  onShowCode,
  onAddSlot
}) => {
  if (showPreview) {
    return null;
  }

  return (
    <div className="bg-gray-50 border-b border-gray-200">
      {/* Timestamps */}
      <div className="px-6 py-2 bg-gray-100">
        <TimestampsRow
          draftConfig={draftConfig}
          latestPublished={latestPublished}
          formatTimeAgo={formatTimeAgo}
          currentViewport={currentViewport}
          onViewportChange={onViewportChange}
        />
      </div>

      {/* Editor Tools */}
      <div className="px-6 py-3">
        <EditorToolbar
          showSlotBorders={showSlotBorders}
          onToggleBorders={onToggleBorders}
          onResetLayout={onResetLayout}
          onShowCode={onShowCode}
          onAddSlot={onAddSlot}
        />
      </div>
    </div>
  );
};

CategoryEditorToolbar.propTypes = {
  showPreview: PropTypes.bool.isRequired,
  draftConfig: PropTypes.object,
  latestPublished: PropTypes.object,
  formatTimeAgo: PropTypes.func.isRequired,
  currentViewport: PropTypes.string.isRequired,
  onViewportChange: PropTypes.func.isRequired,
  showSlotBorders: PropTypes.bool.isRequired,
  onToggleBorders: PropTypes.func.isRequired,
  onResetLayout: PropTypes.func.isRequired,
  onShowCode: PropTypes.func.isRequired,
  onAddSlot: PropTypes.func.isRequired
};

export default CategoryEditorToolbar;