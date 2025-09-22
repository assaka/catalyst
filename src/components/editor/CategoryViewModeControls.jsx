import React from 'react';
import PropTypes from 'prop-types';
import { categoryConfig } from '@/components/editor/slot/configs/category-config';

const CategoryViewModeControls = ({ viewMode, onViewModeChange }) => {
  return (
    <div className="flex bg-gray-100 rounded-lg p-1">
      {categoryConfig.views.map((view) => {
        const IconComponent = view.icon;
        return (
          <button
            key={view.id}
            onClick={() => onViewModeChange(view.id)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              viewMode === view.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
            }`}
          >
            <IconComponent className="w-4 h-4 inline mr-1.5" />
            {view.label}
          </button>
        );
      })}
    </div>
  );
};

CategoryViewModeControls.propTypes = {
  viewMode: PropTypes.string.isRequired,
  onViewModeChange: PropTypes.func.isRequired
};

export default CategoryViewModeControls;