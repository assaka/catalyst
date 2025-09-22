import React from 'react';
import PropTypes from 'prop-types';
import { CategorySlotRenderer } from '@/components/storefront/CategorySlotRenderer';
import { HierarchicalSlotRenderer } from '@/components/editor/slot/SlotComponents';
import { categoryConfig } from '@/components/editor/slot/configs/category-config';
import CmsBlockRenderer from '@/components/storefront/CmsBlockRenderer';

// Simple ErrorBoundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error) {
    console.warn('CategorySlotRenderer error in editor (expected):', error.message);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-sm">
            Preview mode temporarily unavailable. Use Preview button for full preview.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired
};

const CategoryContentRenderer = ({
  categoryLayoutConfig,
  viewMode,
  mockCategoryContext,
  showPreview,
  mode,
  showSlotBorders,
  currentDragInfo,
  setCurrentDragInfo,
  onElementClick,
  onGridResize,
  onSlotHeightResize,
  onSlotDrop,
  onSlotDelete,
  onResizeStart,
  onResizeEnd,
  selectedElement,
  setPageConfig,
  saveConfiguration,
  saveTimeoutRef
}) => {
  if (!categoryLayoutConfig?.slots || Object.keys(categoryLayoutConfig.slots).length === 0) {
    return (
      <div className="col-span-12 text-center py-12 text-gray-500">
        {categoryLayoutConfig ? 'No slots configured' : 'Loading configuration...'}
      </div>
    );
  }

  if (showPreview) {
    // Preview mode: Use CategorySlotRenderer exactly like storefront
    return (
      <>
        <CategorySlotRenderer
          slots={categoryLayoutConfig.slots}
          parentId={null}
          viewMode={viewMode}
          categoryContext={mockCategoryContext}
        />
        {/* Render CMS blocks from configuration */}
        {categoryConfig.cmsBlocks.map((position) => (
          <CmsBlockRenderer key={position} position={position} />
        ))}
      </>
    );
  }

  // Edit mode: Use CategorySlotRenderer with editing overlay
  return (
    <div className="relative">
      {/* Render the actual content using CategorySlotRenderer */}
      <ErrorBoundary>
        <CategorySlotRenderer
          slots={categoryLayoutConfig.slots}
          parentId={null}
          viewMode={viewMode}
          categoryContext={mockCategoryContext}
        />
      </ErrorBoundary>

      {/* Overlay HierarchicalSlotRenderer for editing capabilities */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="grid grid-cols-12 gap-2 auto-rows-min h-full">
          <HierarchicalSlotRenderer
            slots={categoryLayoutConfig.slots}
            parentId={null}
            mode={mode}
            viewMode={viewMode}
            showBorders={showSlotBorders}
            currentDragInfo={currentDragInfo}
            setCurrentDragInfo={setCurrentDragInfo}
            onElementClick={onElementClick}
            onGridResize={onGridResize}
            onSlotHeightResize={onSlotHeightResize}
            onSlotDrop={onSlotDrop}
            onSlotDelete={onSlotDelete}
            onResizeStart={onResizeStart}
            onResizeEnd={onResizeEnd}
            selectedElementId={selectedElement ? selectedElement.getAttribute('data-slot-id') : null}
            setPageConfig={setPageConfig}
            saveConfiguration={saveConfiguration}
            saveTimeoutRef={saveTimeoutRef}
            customSlotRenderer={() => (
              <div
                className="w-full h-full bg-transparent pointer-events-auto"
                style={{
                  minHeight: '20px',
                  border: showSlotBorders ? '1px dashed rgba(59, 130, 246, 0.5)' : 'none'
                }}
              />
            )}
          />
        </div>
      </div>

      {/* Render CMS blocks from configuration */}
      {categoryConfig.cmsBlocks.map((position) => (
        <CmsBlockRenderer key={position} position={position} />
      ))}
    </div>
  );
};

CategoryContentRenderer.propTypes = {
  categoryLayoutConfig: PropTypes.object.isRequired,
  viewMode: PropTypes.string.isRequired,
  mockCategoryContext: PropTypes.object.isRequired,
  showPreview: PropTypes.bool.isRequired,
  mode: PropTypes.string.isRequired,
  showSlotBorders: PropTypes.bool.isRequired,
  currentDragInfo: PropTypes.object,
  setCurrentDragInfo: PropTypes.func.isRequired,
  onElementClick: PropTypes.func.isRequired,
  onGridResize: PropTypes.func.isRequired,
  onSlotHeightResize: PropTypes.func.isRequired,
  onSlotDrop: PropTypes.func.isRequired,
  onSlotDelete: PropTypes.func.isRequired,
  onResizeStart: PropTypes.func.isRequired,
  onResizeEnd: PropTypes.func.isRequired,
  selectedElement: PropTypes.object,
  setPageConfig: PropTypes.func.isRequired,
  saveConfiguration: PropTypes.func.isRequired,
  saveTimeoutRef: PropTypes.object.isRequired
};

export default CategoryContentRenderer;