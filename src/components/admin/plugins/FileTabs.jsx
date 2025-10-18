// src/components/admin/plugins/FileTabs.jsx
import { X, FileText, FileCode } from 'lucide-react';

export default function FileTabs({ openFiles, activeFile, onSwitch, onClose }) {
  const getFileIcon = (fileName) => {
    if (fileName.endsWith('.json')) return <FileText className="w-3 h-3" />;
    if (fileName.endsWith('.jsx') || fileName.endsWith('.js')) return <FileCode className="w-3 h-3" />;
    return <FileText className="w-3 h-3" />;
  };

  return (
    <div className="flex border-b bg-muted/50 overflow-x-auto">
      {openFiles.map(file => {
        const isActive = activeFile?.path === file.path;
        const isModified = file.content !== file.original;

        return (
          <div
            key={file.path}
            className={`
              flex items-center gap-2 px-4 py-2 border-r cursor-pointer
              min-w-[150px] max-w-[200px]
              ${isActive
                ? 'bg-background border-b-2 border-primary text-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }
            `}
            onClick={() => onSwitch(file)}
          >
            {getFileIcon(file.name)}
            <span className="flex-1 text-sm truncate">
              {file.name}
              {isModified && <span className="text-orange-500 ml-1">•</span>}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose(file);
              }}
              className="hover:text-destructive transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
