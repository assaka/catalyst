import React from 'react';
import PropTypes from 'prop-types';
import { ResponsiveContainer } from '@/components/editor/slot/SlotComponents';

const CategoryEditorLayout = ({
  isSidebarVisible,
  showPreview,
  currentViewport,
  children,
  sidebar,
  modals
}) => {
  return (
    <div className={`min-h-screen bg-gray-50 transition-all duration-300 ${
      isSidebarVisible ? 'lg:pr-80' : ''
    }`}>
      {/* Main Content Area */}
      <div className="flex flex-col min-h-screen">
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>

      {/* Sidebar - Mobile overlay, desktop fixed */}
      {isSidebarVisible && (
        <>
          {/* Mobile backdrop */}
          <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-50" />

          {/* Sidebar container */}
          <div className={`fixed top-0 right-0 h-full w-80 z-50 transform transition-transform duration-300 ${
            isSidebarVisible ? 'translate-x-0' : 'translate-x-full'
          } lg:translate-x-0`}>
            {sidebar}
          </div>
        </>
      )}

      {/* Modals */}
      {modals}
    </div>
  );
};

const CategoryEditorContent = ({
  showPreview,
  currentViewport,
  children
}) => {
  return (
    <div className={`flex-1 ${showPreview ? 'bg-white' : 'bg-gray-50'}`}>
      <ResponsiveContainer
        viewport={currentViewport}
        className={showPreview ? 'bg-white' : 'bg-white shadow-sm'}
      >
        <div className={`${
          showPreview
            ? 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'
            : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'
        }`}>
          {children}
        </div>
      </ResponsiveContainer>
    </div>
  );
};

CategoryEditorLayout.propTypes = {
  isSidebarVisible: PropTypes.bool.isRequired,
  showPreview: PropTypes.bool.isRequired,
  currentViewport: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  sidebar: PropTypes.node,
  modals: PropTypes.node
};

CategoryEditorContent.propTypes = {
  showPreview: PropTypes.bool.isRequired,
  currentViewport: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired
};

export { CategoryEditorLayout, CategoryEditorContent };