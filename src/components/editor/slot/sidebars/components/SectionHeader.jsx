import { ChevronDown, ChevronRight } from 'lucide-react';

/**
 * Reusable collapsible section header for sidebars
 */
const SectionHeader = ({ title, section, expanded, onToggle, children }) => (
  <div className="border-b border-gray-200">
    <button
      onClick={() => onToggle(section)}
      className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
    >
      <span className="text-sm font-medium text-gray-900">{title}</span>
      {expanded ? (
        <ChevronDown className="w-4 h-4 text-gray-500" />
      ) : (
        <ChevronRight className="w-4 h-4 text-gray-500" />
      )}
    </button>
    {expanded && (
      <div className="p-3 bg-gray-50">
        {children}
      </div>
    )}
  </div>
);

export default SectionHeader;
