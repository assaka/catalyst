import React, { useState, useRef, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Save, 
  Undo, 
  Redo, 
  Search, 
  Replace, 
  Settings,
  Maximize2,
  Minimize2,
  Code,
  FileText,
  Zap
} from 'lucide-react';

const CodeEditor = ({ 
  code = '', 
  onChange, 
  language = 'javascript',
  fileName = '',
  className = '',
  readOnly = false 
}) => {
  const [localCode, setLocalCode] = useState(code);
  const [isModified, setIsModified] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [replaceTerm, setReplaceTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
  const [undoStack, setUndoStack] = useState([code]);
  const [redoStack, setRedoStack] = useState([]);
  const [currentStackIndex, setCurrentStackIndex] = useState(0);

  const textareaRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    setLocalCode(code);
    setIsModified(false);
  }, [code]);

  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  const handleCodeChange = (newCode) => {
    setLocalCode(newCode);
    setIsModified(newCode !== code);
    
    // Update undo stack
    if (undoStack[currentStackIndex] !== newCode) {
      const newStack = undoStack.slice(0, currentStackIndex + 1);
      newStack.push(newCode);
      setUndoStack(newStack);
      setCurrentStackIndex(newStack.length - 1);
      setRedoStack([]);
    }
    
    onChange && onChange(newCode);
  };

  const handleUndo = () => {
    if (currentStackIndex > 0) {
      const newIndex = currentStackIndex - 1;
      setCurrentStackIndex(newIndex);
      const newCode = undoStack[newIndex];
      setLocalCode(newCode);
      onChange && onChange(newCode);
    }
  };

  const handleRedo = () => {
    if (currentStackIndex < undoStack.length - 1) {
      const newIndex = currentStackIndex + 1;
      setCurrentStackIndex(newIndex);
      const newCode = undoStack[newIndex];
      setLocalCode(newCode);
      onChange && onChange(newCode);
    }
  };

  const handleSave = () => {
    if (isModified && onChange) {
      onChange(localCode);
      setIsModified(false);
    }
  };

  const handleSearch = () => {
    if (!searchTerm || !textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const text = textarea.value.toLowerCase();
    const search = searchTerm.toLowerCase();
    const index = text.indexOf(search);
    
    if (index !== -1) {
      textarea.focus();
      textarea.setSelectionRange(index, index + searchTerm.length);
      textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleReplace = () => {
    if (!searchTerm || !textareaRef.current) return;
    
    const newCode = localCode.replaceAll(searchTerm, replaceTerm);
    handleCodeChange(newCode);
  };

  const updateCursorPosition = () => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const text = textarea.value.substring(0, textarea.selectionStart);
    const lines = text.split('\n');
    const line = lines.length;
    const column = lines[lines.length - 1].length + 1;
    
    setCursorPosition({ line, column });
  };

  const handleKeyDown = (e) => {
    // Handle keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 's':
          e.preventDefault();
          handleSave();
          break;
        case 'z':
          e.preventDefault();
          if (e.shiftKey) {
            handleRedo();
          } else {
            handleUndo();
          }
          break;
        case 'f':
          e.preventDefault();
          setShowSearch(true);
          break;
      }
    }
  };

  const getLanguageIcon = () => {
    switch (language) {
      case 'javascript':
      case 'jsx':
        return '📄';
      case 'typescript':
      case 'tsx':
        return '📘';
      case 'css':
        return '🎨';
      case 'html':
        return '🌐';
      case 'json':
        return '📋';
      default:
        return '📄';
    }
  };

  const getLineNumbers = () => {
    const lines = localCode.split('\n');
    return lines.map((_, index) => index + 1);
  };

  return (
    <div className={`h-full flex flex-col bg-background ${className} ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Header */}
      <div className="border-b p-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-lg">{getLanguageIcon()}</span>
            <span className="font-medium">{fileName || 'Untitled'}</span>
            {isModified && <Badge variant="outline" className="text-xs">Modified</Badge>}
            <Badge variant="secondary" className="text-xs">{language}</Badge>
          </div>
          
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUndo}
              disabled={currentStackIndex === 0 || readOnly}
            >
              <Undo className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRedo}
              disabled={currentStackIndex === undoStack.length - 1 || readOnly}
            >
              <Redo className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSearch(!showSearch)}
            >
              <Search className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSave}
              disabled={!isModified || readOnly}
            >
              <Save className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        {showSearch && (
          <div className="mt-2 flex items-center space-x-2 p-2 bg-muted rounded">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-2 py-1 text-sm border rounded"
            />
            <input
              type="text"
              placeholder="Replace..."
              value={replaceTerm}
              onChange={(e) => setReplaceTerm(e.target.value)}
              className="flex-1 px-2 py-1 text-sm border rounded"
            />
            <Button size="sm" variant="outline" onClick={handleSearch}>
              <Search className="w-3 h-3" />
            </Button>
            <Button size="sm" variant="outline" onClick={handleReplace} disabled={readOnly}>
              <Replace className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Editor Content */}
      <div className="flex-1 flex">
        {/* Line Numbers */}
        <div className="w-12 bg-muted/50 border-r text-right text-sm text-muted-foreground py-2">
          <div className="space-y-0.5">
            {getLineNumbers().map((lineNum) => (
              <div key={lineNum} className="px-2 leading-5">
                {lineNum}
              </div>
            ))}
          </div>
        </div>

        {/* Code Area */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={localCode}
            onChange={(e) => handleCodeChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onSelect={updateCursorPosition}
            onFocus={updateCursorPosition}
            readOnly={readOnly}
            className="w-full h-full p-2 font-mono text-sm bg-transparent border-none outline-none resize-none leading-5"
            style={{
              lineHeight: '1.25',
              tabSize: 2,
              whiteSpace: 'pre',
              overflowWrap: 'break-word'
            }}
            spellCheck={false}
          />
          
          {localCode === '' && !readOnly && (
            <div className="absolute inset-2 flex items-center justify-center text-muted-foreground pointer-events-none">
              <div className="text-center">
                <Code className="w-8 h-8 mx-auto mb-2" />
                <p>Start typing your code here...</p>
                <p className="text-sm mt-1">
                  Use Ctrl+S to save, Ctrl+F to search, Ctrl+Z to undo
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="border-t px-4 py-1 bg-muted/50 text-xs text-muted-foreground">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span>Line {cursorPosition.line}, Column {cursorPosition.column}</span>
            <span>{localCode.length} characters</span>
            <span>{localCode.split('\n').length} lines</span>
          </div>
          
          <div className="flex items-center space-x-2">
            {isModified && <span className="text-orange-600">Unsaved changes</span>}
            <span>{language.toUpperCase()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;