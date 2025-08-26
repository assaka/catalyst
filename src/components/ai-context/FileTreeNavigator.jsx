import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  Folder,
  FolderOpen,
  FileText,
  Search,
  Plus,
  MoreHorizontal,
  ChevronRight,
  ChevronDown,
  Code,
  Image,
  Settings,
  Database,
  Globe
} from 'lucide-react';

const FileTreeNavigator = ({ 
  onFileSelect, 
  selectedFile = null, 
  showDetails = false,
  className = '' 
}) => {
  const [expandedFolders, setExpandedFolders] = useState(new Set(['src', 'src/components', 'src/pages']));
  const [searchTerm, setSearchTerm] = useState('');
  const [fileTree, setFileTree] = useState(null);

  // Mock file tree data - in a real implementation, this would come from an API
  useEffect(() => {
    const mockFileTree = {
      name: 'catalyst',
      type: 'folder',
      children: [
        {
          name: 'src',
          type: 'folder',
          children: [
            {
              name: 'components',
              type: 'folder',
              children: [
                {
                  name: 'ui',
                  type: 'folder',
                  children: [
                    { name: 'button.jsx', type: 'file', size: '2.1kb', modified: '2 hours ago' },
                    { name: 'card.jsx', type: 'file', size: '1.8kb', modified: '3 hours ago' },
                    { name: 'input.jsx', type: 'file', size: '1.5kb', modified: '1 day ago' },
                    { name: 'tabs.jsx', type: 'file', size: '3.2kb', modified: '2 days ago' }
                  ]
                },
                {
                  name: 'ai-context',
                  type: 'folder',
                  children: [
                    { name: 'AIContextWindow.jsx', type: 'file', size: '8.7kb', modified: '1 hour ago' },
                    { name: 'StorefrontPreview.jsx', type: 'file', size: '6.3kb', modified: '2 hours ago' },
                    { name: 'CodeEditor.jsx', type: 'file', size: '5.1kb', modified: '1 hour ago' },
                    { name: 'FileTreeNavigator.jsx', type: 'file', size: '4.9kb', modified: '30 min ago' },
                    { name: 'DiffPreviewSystem.jsx', type: 'file', size: '7.2kb', modified: '45 min ago' },
                    { name: 'BrowserPreview.jsx', type: 'file', size: '3.8kb', modified: '1 hour ago' }
                  ]
                },
                {
                  name: 'layout',
                  type: 'folder',
                  children: [
                    { name: 'Header.jsx', type: 'file', size: '4.2kb', modified: '1 day ago' },
                    { name: 'Footer.jsx', type: 'file', size: '2.8kb', modified: '2 days ago' },
                    { name: 'Sidebar.jsx', type: 'file', size: '3.5kb', modified: '1 day ago' }
                  ]
                }
              ]
            },
            {
              name: 'pages',
              type: 'folder',
              children: [
                { name: 'index.jsx', type: 'file', size: '12.4kb', modified: '3 hours ago' },
                { name: 'Dashboard.jsx', type: 'file', size: '8.9kb', modified: '1 day ago' },
                { name: 'Products.jsx', type: 'file', size: '15.2kb', modified: '2 hours ago' },
                { name: 'Cart.jsx', type: 'file', size: '6.7kb', modified: '4 hours ago' },
                { name: 'AIContextWindow.jsx', type: 'file', size: '9.1kb', modified: '1 hour ago' }
              ]
            },
            {
              name: 'services',
              type: 'folder',
              children: [
                { name: 'api.js', type: 'file', size: '3.4kb', modified: '1 day ago' },
                { name: 'auth.js', type: 'file', size: '2.1kb', modified: '3 days ago' },
                { name: 'storage.js', type: 'file', size: '1.9kb', modified: '2 days ago' }
              ]
            },
            {
              name: 'styles',
              type: 'folder',
              children: [
                { name: 'globals.css', type: 'file', size: '2.8kb', modified: '1 week ago' },
                { name: 'components.css', type: 'file', size: '4.1kb', modified: '3 days ago' }
              ]
            }
          ]
        },
        {
          name: 'backend',
          type: 'folder',
          children: [
            {
              name: 'src',
              type: 'folder',
              children: [
                {
                  name: 'routes',
                  type: 'folder',
                  children: [
                    { name: 'auth.js', type: 'file', size: '5.6kb', modified: '2 days ago' },
                    { name: 'products.js', type: 'file', size: '8.3kb', modified: '1 day ago' },
                    { name: 'users.js', type: 'file', size: '4.7kb', modified: '3 days ago' }
                  ]
                },
                {
                  name: 'models',
                  type: 'folder',
                  children: [
                    { name: 'Product.js', type: 'file', size: '3.2kb', modified: '2 days ago' },
                    { name: 'User.js', type: 'file', size: '2.8kb', modified: '1 week ago' },
                    { name: 'Order.js', type: 'file', size: '4.1kb', modified: '3 days ago' }
                  ]
                }
              ]
            }
          ]
        },
        { name: 'package.json', type: 'file', size: '1.2kb', modified: '1 day ago' },
        { name: 'README.md', type: 'file', size: '3.4kb', modified: '1 week ago' },
        { name: '.gitignore', type: 'file', size: '0.8kb', modified: '2 weeks ago' }
      ]
    };

    setFileTree(mockFileTree);
  }, []);

  const toggleFolder = (path) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const handleFileClick = (file, path) => {
    if (file.type === 'file') {
      onFileSelect && onFileSelect({ ...file, path });
    }
  };

  const getFileIcon = (file) => {
    if (file.type === 'folder') {
      return expandedFolders.has(file.path) ? (
        <FolderOpen className="w-4 h-4 text-blue-500" />
      ) : (
        <Folder className="w-4 h-4 text-blue-500" />
      );
    }

    const extension = file.name.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'jsx':
      case 'js':
      case 'ts':
      case 'tsx':
        return <Code className="w-4 h-4 text-yellow-500" />;
      case 'css':
      case 'scss':
      case 'less':
        return <Settings className="w-4 h-4 text-pink-500" />;
      case 'json':
        return <Database className="w-4 h-4 text-green-500" />;
      case 'md':
      case 'txt':
        return <FileText className="w-4 h-4 text-gray-500" />;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'svg':
        return <Image className="w-4 h-4 text-purple-500" />;
      case 'html':
        return <Globe className="w-4 h-4 text-orange-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  const filterFiles = (node, searchTerm, path = '') => {
    if (!searchTerm) return node;

    const currentPath = path ? `${path}/${node.name}` : node.name;
    
    if (node.type === 'file') {
      return node.name.toLowerCase().includes(searchTerm.toLowerCase()) ? 
        { ...node, path: currentPath } : null;
    }

    if (node.type === 'folder') {
      const filteredChildren = node.children
        ?.map(child => filterFiles(child, searchTerm, currentPath))
        .filter(Boolean) || [];

      if (filteredChildren.length > 0 || node.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return {
          ...node,
          path: currentPath,
          children: filteredChildren
        };
      }
    }

    return null;
  };

  const renderFileTreeNode = (node, depth = 0, path = '') => {
    if (!node) return null;

    const currentPath = path ? `${path}/${node.name}` : node.name;
    const isExpanded = expandedFolders.has(currentPath);
    const isSelected = selectedFile?.path === currentPath;
    const nodeWithPath = { ...node, path: currentPath };

    return (
      <div key={currentPath}>
        <div
          className={`flex items-center space-x-1 px-2 py-1 hover:bg-muted/50 cursor-pointer ${
            isSelected ? 'bg-primary/10 text-primary' : ''
          }`}
          style={{ paddingLeft: `${8 + depth * 16}px` }}
          onClick={() => {
            if (node.type === 'folder') {
              toggleFolder(currentPath);
            } else {
              handleFileClick(nodeWithPath, currentPath);
            }
          }}
        >
          {node.type === 'folder' && (
            <div className="w-4 h-4 flex items-center justify-center">
              {isExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </div>
          )}
          
          {getFileIcon(nodeWithPath)}
          
          <span className="flex-1 text-sm font-medium">{node.name}</span>
          
          {showDetails && node.type === 'file' && (
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <span>{node.size}</span>
              <span>{node.modified}</span>
            </div>
          )}
        </div>

        {node.type === 'folder' && isExpanded && node.children && (
          <div>
            {node.children.map(child => 
              renderFileTreeNode(child, depth + 1, currentPath)
            )}
          </div>
        )}
      </div>
    );
  };

  const filteredTree = fileTree ? filterFiles(fileTree, searchTerm) : null;

  return (
    <Card className={`h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="border-b p-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Files</h3>
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="sm">
              <Plus className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* File Tree */}
      <ScrollArea className="flex-1">
        <div className="p-1">
          {filteredTree ? (
            renderFileTreeNode(filteredTree)
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <FileText className="w-8 h-8 mx-auto mb-2" />
              <p>Loading files...</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      {showDetails && (
        <div className="border-t p-3 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>
              {selectedFile ? `Selected: ${selectedFile.name}` : 'No file selected'}
            </span>
            <Badge variant="outline">
              {expandedFolders.size} folders open
            </Badge>
          </div>
        </div>
      )}
    </Card>
  );
};

export default FileTreeNavigator;