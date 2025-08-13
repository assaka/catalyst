import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import ModeHeader from '@/components/shared/ModeHeader';
import { 
  Eye, 
  Send, 
  MessageSquare, 
  Settings, 
  Palette, 
  Type, 
  Image, 
  Layout,
  Code,
  User as UserIcon,
  Grid,
  Layers,
  Move,
  Box,
  Smartphone,
  Monitor,
  Tablet,
  FileText,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  File,
  X
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const EditorLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [chatOpen, setChatOpen] = useState(true);
  const [previewMode, setPreviewMode] = useState(false);
  const [activeTool, setActiveTool] = useState('layout');
  const [viewMode, setViewMode] = useState('desktop'); // desktop, tablet, mobile
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: "I'm here to help you customize your store template. What would you like to change?",
      timestamp: new Date()
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // File tree state
  const [selectedFile, setSelectedFile] = useState(null);
  const [expandedFolders, setExpandedFolders] = useState({
    'storefront-pages': true,
    'storefront-components': true,
    'admin-pages': false,
    'ui-components': false,
    'layouts': false,
    'styles': false
  });
  const [fileTreeOpen, setFileTreeOpen] = useState(true);
  
  // Get user info for shared header
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // File tree data structure - actual storefront files
  const fileTree = {
    'storefront-pages': {
      name: 'Storefront Pages',
      type: 'folder',
      children: {
        'Storefront.jsx': { name: 'Storefront.jsx', type: 'file', language: 'jsx' },
        'ProductDetail.jsx': { name: 'ProductDetail.jsx', type: 'file', language: 'jsx' },
        'Cart.jsx': { name: 'Cart.jsx', type: 'file', language: 'jsx' },
        'Checkout.jsx': { name: 'Checkout.jsx', type: 'file', language: 'jsx' },
        'OrderSuccess.jsx': { name: 'OrderSuccess.jsx', type: 'file', language: 'jsx' },
        'CustomerDashboard.jsx': { name: 'CustomerDashboard.jsx', type: 'file', language: 'jsx' },
        'CmsPageViewer.jsx': { name: 'CmsPageViewer.jsx', type: 'file', language: 'jsx' },
        'HtmlSitemap.jsx': { name: 'HtmlSitemap.jsx', type: 'file', language: 'jsx' }
      }
    },
    'storefront-components': {
      name: 'Storefront Components',
      type: 'folder',
      children: {
        'StorefrontLayout.jsx': { name: 'StorefrontLayout.jsx', type: 'file', language: 'jsx' },
        'ProductCard.jsx': { name: 'ProductCard.jsx', type: 'file', language: 'jsx' },
        'CategoryNav.jsx': { name: 'CategoryNav.jsx', type: 'file', language: 'jsx' },
        'HeaderSearch.jsx': { name: 'HeaderSearch.jsx', type: 'file', language: 'jsx' },
        'MiniCart.jsx': { name: 'MiniCart.jsx', type: 'file', language: 'jsx' },
        'Breadcrumb.jsx': { name: 'Breadcrumb.jsx', type: 'file', language: 'jsx' },
        'LayeredNavigation.jsx': { name: 'LayeredNavigation.jsx', type: 'file', language: 'jsx' },
        'WishlistDropdown.jsx': { name: 'WishlistDropdown.jsx', type: 'file', language: 'jsx' },
        'RecommendedProducts.jsx': { name: 'RecommendedProducts.jsx', type: 'file', language: 'jsx' },
        'RelatedProductsViewer.jsx': { name: 'RelatedProductsViewer.jsx', type: 'file', language: 'jsx' },
        'ProductLabel.jsx': { name: 'ProductLabel.jsx', type: 'file', language: 'jsx' },
        'CustomOptions.jsx': { name: 'CustomOptions.jsx', type: 'file', language: 'jsx' },
        'CmsBlockRenderer.jsx': { name: 'CmsBlockRenderer.jsx', type: 'file', language: 'jsx' },
        'CookieConsentBanner.jsx': { name: 'CookieConsentBanner.jsx', type: 'file', language: 'jsx' },
        'FlashMessage.jsx': { name: 'FlashMessage.jsx', type: 'file', language: 'jsx' }
      }
    },
    'admin-pages': {
      name: 'Admin Pages',
      type: 'folder',
      children: {
        'Dashboard.jsx': { name: 'Dashboard.jsx', type: 'file', language: 'jsx' },
        'Products.jsx': { name: 'Products.jsx', type: 'file', language: 'jsx' },
        'Categories.jsx': { name: 'Categories.jsx', type: 'file', language: 'jsx' },
        'Attributes.jsx': { name: 'Attributes.jsx', type: 'file', language: 'jsx' },
        'Orders.jsx': { name: 'Orders.jsx', type: 'file', language: 'jsx' },
        'Customers.jsx': { name: 'Customers.jsx', type: 'file', language: 'jsx' },
        'CmsPages.jsx': { name: 'CmsPages.jsx', type: 'file', language: 'jsx' },
        'CmsBlocks.jsx': { name: 'CmsBlocks.jsx', type: 'file', language: 'jsx' },
        'Settings.jsx': { name: 'Settings.jsx', type: 'file', language: 'jsx' },
        'ThemeLayout.jsx': { name: 'ThemeLayout.jsx', type: 'file', language: 'jsx' },
        'TemplateEditor.jsx': { name: 'TemplateEditor.jsx', type: 'file', language: 'jsx' }
      }
    },
    'ui-components': {
      name: 'UI Components',
      type: 'folder',
      children: {
        'button.jsx': { name: 'button.jsx', type: 'file', language: 'jsx' },
        'card.jsx': { name: 'card.jsx', type: 'file', language: 'jsx' },
        'input.jsx': { name: 'input.jsx', type: 'file', language: 'jsx' },
        'select.jsx': { name: 'select.jsx', type: 'file', language: 'jsx' },
        'dialog.jsx': { name: 'dialog.jsx', type: 'file', language: 'jsx' },
        'dropdown-menu.jsx': { name: 'dropdown-menu.jsx', type: 'file', language: 'jsx' },
        'tabs.jsx': { name: 'tabs.jsx', type: 'file', language: 'jsx' },
        'table.jsx': { name: 'table.jsx', type: 'file', language: 'jsx' },
        'badge.jsx': { name: 'badge.jsx', type: 'file', language: 'jsx' },
        'alert.jsx': { name: 'alert.jsx', type: 'file', language: 'jsx' },
        'pagination.jsx': { name: 'pagination.jsx', type: 'file', language: 'jsx' },
        'skeleton.jsx': { name: 'skeleton.jsx', type: 'file', language: 'jsx' }
      }
    },
    'layouts': {
      name: 'Layouts',
      type: 'folder',
      children: {
        'Layout.jsx': { name: 'Layout.jsx', type: 'file', language: 'jsx' },
        'EditorLayout.jsx': { name: 'EditorLayout.jsx', type: 'file', language: 'jsx' },
        'StorefrontLayout.jsx': { name: 'StorefrontLayout.jsx', type: 'file', language: 'jsx' }
      }
    },
    'styles': {
      name: 'Styles',
      type: 'folder',
      children: {
        'App.css': { name: 'App.css', type: 'file', language: 'css' },
        'index.css': { name: 'index.css', type: 'file', language: 'css' }
      }
    }
  };

  // Auto-save functionality
  useEffect(() => {
    if (hasUnsavedChanges) {
      const timer = setTimeout(() => {
        // Simulate auto-save
        setLastSaved(new Date());
        setHasUnsavedChanges(false);
        setChatMessages(prev => [...prev, {
          id: Date.now(),
          type: 'ai',
          content: "💾 Auto-saved your changes",
          timestamp: new Date()
        }]);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [hasUnsavedChanges]);
  
  const switchToAdmin = () => {
    navigate('/admin/dashboard');
  };
  
  const switchToEditor = () => {
    // Already in editor mode, do nothing
  };

  // File tree helper functions
  const toggleFolder = (folderKey) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderKey]: !prev[folderKey]
    }));
  };

  const handleFileSelect = async (filePath, fileName, fileType) => {
    // Map file tree paths to actual file system paths
    const fileMapping = {
      // Storefront Pages
      'storefront-pages/Storefront.jsx': 'src/pages/Storefront.jsx',
      'storefront-pages/ProductDetail.jsx': 'src/pages/ProductDetail.jsx',
      'storefront-pages/Cart.jsx': 'src/pages/Cart.jsx',
      'storefront-pages/Checkout.jsx': 'src/pages/Checkout.jsx',
      'storefront-pages/OrderSuccess.jsx': 'src/pages/OrderSuccess.jsx',
      'storefront-pages/CustomerDashboard.jsx': 'src/pages/CustomerDashboard.jsx',
      'storefront-pages/CmsPageViewer.jsx': 'src/pages/CmsPageViewer.jsx',
      'storefront-pages/HtmlSitemap.jsx': 'src/pages/HtmlSitemap.jsx',
      
      // Storefront Components
      'storefront-components/StorefrontLayout.jsx': 'src/components/storefront/StorefrontLayout.jsx',
      'storefront-components/ProductCard.jsx': 'src/components/storefront/ProductCard.jsx',
      'storefront-components/CategoryNav.jsx': 'src/components/storefront/CategoryNav.jsx',
      'storefront-components/HeaderSearch.jsx': 'src/components/storefront/HeaderSearch.jsx',
      'storefront-components/MiniCart.jsx': 'src/components/storefront/MiniCart.jsx',
      'storefront-components/Breadcrumb.jsx': 'src/components/storefront/Breadcrumb.jsx',
      'storefront-components/LayeredNavigation.jsx': 'src/components/storefront/LayeredNavigation.jsx',
      'storefront-components/WishlistDropdown.jsx': 'src/components/storefront/WishlistDropdown.jsx',
      'storefront-components/RecommendedProducts.jsx': 'src/components/storefront/RecommendedProducts.jsx',
      'storefront-components/RelatedProductsViewer.jsx': 'src/components/storefront/RelatedProductsViewer.jsx',
      'storefront-components/ProductLabel.jsx': 'src/components/storefront/ProductLabel.jsx',
      'storefront-components/CustomOptions.jsx': 'src/components/storefront/CustomOptions.jsx',
      'storefront-components/CmsBlockRenderer.jsx': 'src/components/storefront/CmsBlockRenderer.jsx',
      'storefront-components/CookieConsentBanner.jsx': 'src/components/storefront/CookieConsentBanner.jsx',
      'storefront-components/FlashMessage.jsx': 'src/components/storefront/FlashMessage.jsx',
      
      // Admin Pages
      'admin-pages/Dashboard.jsx': 'src/pages/Dashboard.jsx',
      'admin-pages/Products.jsx': 'src/pages/Products.jsx',
      'admin-pages/Categories.jsx': 'src/pages/Categories.jsx',
      'admin-pages/Attributes.jsx': 'src/pages/Attributes.jsx',
      'admin-pages/Orders.jsx': 'src/pages/Orders.jsx',
      'admin-pages/Customers.jsx': 'src/pages/Customers.jsx',
      'admin-pages/CmsPages.jsx': 'src/pages/CmsPages.jsx',
      'admin-pages/CmsBlocks.jsx': 'src/pages/CmsBlocks.jsx',
      'admin-pages/Settings.jsx': 'src/pages/Settings.jsx',
      'admin-pages/ThemeLayout.jsx': 'src/pages/ThemeLayout.jsx',
      'admin-pages/TemplateEditor.jsx': 'src/pages/TemplateEditor.jsx',
      
      // UI Components
      'ui-components/button.jsx': 'src/components/ui/button.jsx',
      'ui-components/card.jsx': 'src/components/ui/card.jsx',
      'ui-components/input.jsx': 'src/components/ui/input.jsx',
      'ui-components/select.jsx': 'src/components/ui/select.jsx',
      'ui-components/dialog.jsx': 'src/components/ui/dialog.jsx',
      'ui-components/dropdown-menu.jsx': 'src/components/ui/dropdown-menu.jsx',
      'ui-components/tabs.jsx': 'src/components/ui/tabs.jsx',
      'ui-components/table.jsx': 'src/components/ui/table.jsx',
      'ui-components/badge.jsx': 'src/components/ui/badge.jsx',
      'ui-components/alert.jsx': 'src/components/ui/alert.jsx',
      'ui-components/pagination.jsx': 'src/components/ui/pagination.jsx',
      'ui-components/skeleton.jsx': 'src/components/ui/skeleton.jsx',
      
      // Layouts
      'layouts/Layout.jsx': 'src/pages/Layout.jsx',
      'layouts/EditorLayout.jsx': 'src/components/EditorLayout.jsx',
      'layouts/StorefrontLayout.jsx': 'src/components/storefront/StorefrontLayout.jsx',
      
      // Styles
      'styles/App.css': 'src/App.css',
      'styles/index.css': 'src/index.css'
    };
    
    const actualPath = fileMapping[filePath];
    let content = `// Loading ${fileName}...\n// File path: ${actualPath || 'Path not mapped'}\n\n`;
    let loadSuccess = false; // Declare at function scope
    
    // Try to load actual file content
    if (actualPath) {
      try {
        // Add loading state
        setChatMessages(prev => [...prev, {
          id: Date.now() - 1,
          type: 'ai',
          content: `📁 Loading ${fileName}...`,
          timestamp: new Date()
        }]);
        
        // Try multiple methods to load the file content
        
        // Method 1: Try loading via API endpoint
        try {
          const apiResponse = await fetch(`/api/files/content?path=${encodeURIComponent(actualPath)}`, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('store_owner_auth_token')}`
            }
          });
          
          if (apiResponse.ok) {
            const data = await apiResponse.json();
            if (data.success && data.content) {
              content = data.content;
              loadSuccess = true;
            }
          }
        } catch (apiError) {
          console.log('API method failed, trying direct fetch...');
        }
        
        // Method 2: Try direct fetch from public path (for development)
        if (!loadSuccess) {
          try {
            const response = await fetch(`/${actualPath}?t=${Date.now()}`, {
              method: 'GET',
              headers: {
                'Accept': 'text/plain'
              }
            });
            
            if (response && response.ok) {
              const text = await response.text();
              // Check if we got actual file content (not HTML error page)
              if (!text.includes('<!DOCTYPE html>') && !text.includes('<html')) {
                content = text;
                loadSuccess = true;
              }
            }
          } catch (fetchError) {
            console.log('Direct fetch failed, using fallback...');
          }
        }
        
        // Method 3: Fallback with enhanced mock content
        if (!loadSuccess) {
          // Fallback: Try loading from the file system path directly
          const absolutePath = `C:/Users/info/PhpstormProjects/catalyst/${actualPath}`;
          
          // Since we can't directly read files in browser, provide better mock content based on file type
          if (fileType === 'jsx') {
            const componentName = fileName.split('.')[0];
            content = `import React from 'react';\n\n// ${componentName} Component\n// This is a React component file\n// Actual content would be loaded here\n\nconst ${componentName} = () => {\n  return (\n    <div className="p-4">\n      <h1>${componentName}</h1>\n      {/* Component implementation */}\n    </div>\n  );\n};\n\nexport default ${componentName};`;
          } else if (fileType === 'css') {
            content = `/* ${fileName} */\n/* Stylesheet for the application */\n/* Actual CSS content would be loaded here */\n\n.container {\n  padding: 1rem;\n  margin: 0 auto;\n  max-width: 1200px;\n}\n\n/* Add your styles here */`;
          } else {
            content = `// ${fileName}\n// File type: ${fileType}\n// Path: ${actualPath}\n// Actual file content would be loaded here`;
          }
        }
      } catch (error) {
        console.error('Error loading file:', error);
        content = `// Error loading ${fileName}\n// ${error.message}\n// File path: ${actualPath}\n\n// Fallback content shown below:\n\n`;
        
        if (fileType === 'jsx') {
          const componentName = fileName.split('.')[0].replace(/[^a-zA-Z0-9]/g, '');
          content += `const ${componentName} = () => {\n  return (\n    <div className="p-4">\n      <h1>${componentName} Component</h1>\n      {/* Component content here */}\n    </div>\n  );\n};\n\nexport default ${componentName};`;
        } else if (fileType === 'css') {
          content += `/* ${fileName} styles */\n\n.container {\n  padding: 1rem;\n  margin: 0 auto;\n}\n\n/* Add your styles here */`;
        }
      }
    } else {
      content = `// File mapping not found for: ${filePath}\n// Please add mapping for this file in EditorLayout.jsx\n\n// Available paths in fileMapping:\n${Object.keys(fileMapping).map(key => `// - ${key}`).join('\n')}`;
    }
    
    setSelectedFile({
      path: filePath,
      name: fileName,
      type: fileType,
      actualPath: actualPath,
      content: content
    });
    
    // Add AI message about file selection
    setChatMessages(prev => [...prev, {
      id: Date.now(),
      type: 'ai',
      content: `Opened ${fileName}. ${loadSuccess !== undefined ? (loadSuccess ? '✅ Loaded actual file content.' : '⚠️ Showing fallback content - actual file content could not be loaded.') : ''} This is a ${fileType === 'jsx' ? 'React component' : fileType === 'css' ? 'CSS stylesheet' : fileType} file. I can help you understand its structure, suggest improvements, or explain how it fits into the storefront architecture.`,
      timestamp: new Date()
    }]);
  };

  const editorTools = [
    { id: 'layout', icon: Layout, label: 'Layout' },
    { id: 'typography', icon: Type, label: 'Typography' },
    { id: 'colors', icon: Palette, label: 'Colors' },
    { id: 'images', icon: Image, label: 'Images' },
    { id: 'components', icon: Box, label: 'Components' },
    { id: 'layers', icon: Layers, label: 'Layers' },
    { id: 'code', icon: Code, label: 'Custom Code' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  const handleToolSelect = (toolId) => {
    setActiveTool(toolId);
    setHasUnsavedChanges(true);
    
    // Add context-aware AI message when tool changes
    const toolMessages = {
      layout: "I can help you adjust the layout structure, spacing, and grid system.",
      typography: "Let's work on fonts, text sizes, and typography styling.",
      colors: "I can help you choose and apply colors to your template.",
      images: "Ready to work with images, galleries, and visual content.",
      components: "Let's add or modify components like buttons, forms, and widgets.",
      layers: "I can help you organize and manage template layers.",
      code: "Ready to help with custom CSS, HTML, or JavaScript code.",
      settings: "Let's configure template settings and behavior options."
    };
    
    if (toolMessages[toolId]) {
      setChatMessages(prev => [...prev, {
        id: Date.now(),
        type: 'ai',
        content: toolMessages[toolId],
        timestamp: new Date()
      }]);
    }
  };

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    
    // Add user message
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: chatInput,
      timestamp: new Date()
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    
    // Simulate AI response after a delay
    setTimeout(() => {
      const aiResponse = {
        id: Date.now() + 1,
        type: 'ai',
        content: `I understand you want to work on "${chatInput}". I'll help you with that using the ${activeTool} tool. What specific changes would you like to make?`,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  const handlePreview = () => {
    setPreviewMode(!previewMode);
    if (!previewMode) {
      setChatMessages(prev => [...prev, {
        id: Date.now(),
        type: 'ai',
        content: `Switching to preview mode. You can see how your ${activeTool} changes look to visitors.`,
        timestamp: new Date()
      }]);
    }
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    
    // Add AI message about publishing
    setChatMessages(prev => [...prev, {
      id: Date.now(),
      type: 'ai',
      content: "Publishing your template changes to make them live on your store...",
      timestamp: new Date()
    }]);

    try {
      // Simulate publish process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setLastSaved(new Date());
      setChatMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'ai',
        content: "✅ Successfully published! Your changes are now live on your store.",
        timestamp: new Date()
      }]);
    } catch (error) {
      setChatMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'ai',
        content: "❌ Publishing failed. Please try again or check your connection.",
        timestamp: new Date()
      }]);
    } finally {
      setIsPublishing(false);
    }
  };

  // File Tree Component
  const FileTreeItem = ({ itemKey, item, level = 0 }) => {
    const isFolder = item.type === 'folder';
    const isExpanded = expandedFolders[itemKey];
    const isSelected = selectedFile?.path === itemKey;

    return (
      <div>
        <div
          className={`flex items-center px-2 py-1 hover:bg-gray-100 cursor-pointer rounded ${
            isSelected ? 'bg-blue-50 text-blue-700' : ''
          }`}
          style={{ paddingLeft: `${(level * 16) + 8}px` }}
          onClick={() => {
            if (isFolder) {
              toggleFolder(itemKey);
            } else {
              handleFileSelect(itemKey, item.name, item.language);
            }
          }}
        >
          {isFolder ? (
            <>
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 mr-1 text-gray-500" />
              ) : (
                <ChevronRight className="w-4 h-4 mr-1 text-gray-500" />
              )}
              {isExpanded ? (
                <FolderOpen className="w-4 h-4 mr-2 text-blue-500" />
              ) : (
                <Folder className="w-4 h-4 mr-2 text-blue-500" />
              )}
            </>
          ) : (
            <>
              <div className="w-4 h-4 mr-1" />
              {item.language === 'jsx' ? (
                <FileText className="w-4 h-4 mr-2 text-green-500" />
              ) : item.language === 'css' ? (
                <FileText className="w-4 h-4 mr-2 text-purple-500" />
              ) : (
                <File className="w-4 h-4 mr-2 text-gray-500" />
              )}
            </>
          )}
          <span className="text-sm truncate">{item.name}</span>
        </div>
        
        {isFolder && isExpanded && item.children && (
          <div>
            {Object.entries(item.children).map(([childKey, childItem]) => (
              <FileTreeItem
                key={childKey}
                itemKey={`${itemKey}/${childKey}`}
                item={childItem}
                level={level + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderToolContent = () => {
    switch (activeTool) {
      case 'layout':
        return (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Layout Settings</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg hover:border-blue-500 cursor-pointer">
                <Grid className="w-8 h-8 text-gray-600 mb-2" />
                <p className="text-sm font-medium">Grid Layout</p>
                <p className="text-xs text-gray-500">Organize content in a grid</p>
              </div>
              <div className="p-4 border rounded-lg hover:border-blue-500 cursor-pointer">
                <Layout className="w-8 h-8 text-gray-600 mb-2" />
                <p className="text-sm font-medium">Flex Layout</p>
                <p className="text-xs text-gray-500">Flexible content arrangement</p>
              </div>
            </div>
          </div>
        );
      case 'typography':
        return (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Typography</h4>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Font Family</label>
                <select className="w-full mt-1 p-2 border rounded-md">
                  <option>Inter</option>
                  <option>Roboto</option>
                  <option>Open Sans</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Font Size</label>
                <input type="range" min="12" max="24" className="w-full mt-1" />
              </div>
            </div>
          </div>
        );
      case 'colors':
        return (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Color Palette</h4>
            <div className="grid grid-cols-4 gap-2">
              {['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'].map(color => (
                <div 
                  key={color}
                  className="w-12 h-12 rounded-lg border-2 border-gray-200 cursor-pointer hover:border-gray-400"
                  style={{ backgroundColor: color }}
                  onClick={() => setHasUnsavedChanges(true)}
                />
              ))}
            </div>
          </div>
        );
      case 'images':
        return (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Images</h4>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Image className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-sm text-gray-600">Drop images here or click to upload</p>
            </div>
          </div>
        );
      case 'components':
        return (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Components</h4>
            <div className="space-y-2">
              {[
                { name: 'Header', icon: Layout },
                { name: 'Button', icon: Box },
                { name: 'Text Block', icon: Type },
                { name: 'Image Gallery', icon: Image }
              ].map(component => (
                <div key={component.name} className="p-3 border rounded-lg hover:border-blue-500 cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <component.icon className="w-5 h-5 text-gray-600" />
                    <span className="text-sm font-medium">{component.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">{activeTool.charAt(0).toUpperCase() + activeTool.slice(1)}</h4>
            <p className="text-gray-600">Tool configuration panel will appear here.</p>
            {children}
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <ModeHeader 
        user={user} 
        currentMode="editor"
        showExtraButtons={true}
        extraButtons={
          <>
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
              <Button
                size="sm"
                variant={viewMode === 'desktop' ? 'default' : 'ghost'}
                onClick={() => setViewMode('desktop')}
                className="px-3 py-1"
              >
                <Monitor className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'tablet' ? 'default' : 'ghost'}
                onClick={() => setViewMode('tablet')}
                className="px-3 py-1"
              >
                <Tablet className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'mobile' ? 'default' : 'ghost'}
                onClick={() => setViewMode('mobile')}
                className="px-3 py-1"
              >
                <Smartphone className="w-4 h-4" />
              </Button>
            </div>
            {!chatOpen && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setChatOpen(true)}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                AI Chat
              </Button>
            )}
            {!fileTreeOpen && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFileTreeOpen(true)}
              >
                <FileText className="w-4 h-4 mr-2" />
                Files
              </Button>
            )}
            <Button
              variant={previewMode ? "default" : "outline"}
              size="sm"
              onClick={handlePreview}
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button 
              size="sm" 
              onClick={handlePublish}
              disabled={isPublishing}
            >
              <Send className="w-4 h-4 mr-2" />
              {isPublishing ? 'Publishing...' : 'Publish'}
            </Button>
            {lastSaved && (
              <div className="text-xs text-gray-500">
                Last saved: {lastSaved.toLocaleTimeString()}
              </div>
            )}
          </>
        }
      />
      
      <div className="flex flex-1 overflow-hidden">
        {/* AI Chat Context Column */}
        <div className={`transition-all duration-300 bg-white border-r border-gray-200 ${chatOpen ? 'w-80' : 'w-0'} overflow-hidden`}>
        <div className="h-full flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">AI Assistant</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setChatOpen(!chatOpen)}
              >
                <MessageSquare className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-3">
              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`p-3 rounded-lg ${
                    message.type === 'ai' 
                      ? 'bg-blue-50 text-blue-800' 
                      : 'bg-gray-100 text-gray-800 ml-4'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              ))}
              
              <div className="space-y-2 pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-700">Quick Actions</h4>
                <div className="space-y-1">
                  <button 
                    className="w-full text-left p-2 text-sm text-gray-600 hover:bg-gray-50 rounded"
                    onClick={() => handleToolSelect('colors')}
                  >
                    Change color scheme
                  </button>
                  <button 
                    className="w-full text-left p-2 text-sm text-gray-600 hover:bg-gray-50 rounded"
                    onClick={() => handleToolSelect('layout')}
                  >
                    Modify layout structure
                  </button>
                  <button 
                    className="w-full text-left p-2 text-sm text-gray-600 hover:bg-gray-50 rounded"
                    onClick={() => handleToolSelect('typography')}
                  >
                    Update typography
                  </button>
                  <button 
                    className="w-full text-left p-2 text-sm text-gray-600 hover:bg-gray-50 rounded"
                    onClick={() => handleToolSelect('components')}
                  >
                    Add custom sections
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-4 border-t border-gray-200">
            <div className="flex space-x-2">
              <input 
                type="text" 
                placeholder="Ask me anything..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button size="sm" onClick={handleSendMessage}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
        </div>

        {/* File Tree Column */}
        <div className={`transition-all duration-300 bg-white border-r border-gray-200 ${fileTreeOpen ? 'w-64' : 'w-0'} overflow-hidden`}>
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Files</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFileTreeOpen(!fileTreeOpen)}
                >
                  <FileText className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex-1 p-2 overflow-y-auto">
              <div className="space-y-1">
                {Object.entries(fileTree).map(([key, item]) => (
                  <FileTreeItem
                    key={key}
                    itemKey={key}
                    item={item}
                    level={0}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex">
        <div className="flex-1 flex">
          {/* Editor Toolbar */}
          <div className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4 space-y-4">
            {editorTools.map((tool) => (
              <Button
                key={tool.id}
                variant="ghost"
                size="icon"
                className={`w-10 h-10 ${activeTool === tool.id ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
                title={tool.label}
                onClick={() => handleToolSelect(tool.id)}
              >
                <tool.icon className="w-5 h-5" />
              </Button>
            ))}
          </div>

          {/* Live Preview Area */}
          <div className="flex-1 bg-gray-100 p-6">
            <div className={`bg-white rounded-lg shadow-sm h-full overflow-auto transition-all duration-300 ${
              viewMode === 'desktop' ? 'w-full' : 
              viewMode === 'tablet' ? 'w-[768px] mx-auto' : 
              'w-[375px] mx-auto'
            }`}>
              {selectedFile ? (
                <div className="h-full flex flex-col">
                  <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-700">
                        {selectedFile.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-gray-500 bg-white px-2 py-1 rounded">
                          {selectedFile.type}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedFile(null)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 p-4 bg-gray-900 text-gray-100 font-mono text-sm overflow-auto">
                    <pre className="whitespace-pre-wrap">{selectedFile.content}</pre>
                  </div>
                </div>
              ) : previewMode ? (
                <div className="p-8">
                  <div className="text-center">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Live Preview</h3>
                    <p className="text-gray-600">Your store template preview will appear here</p>
                    <div className="mt-4 text-sm text-gray-500">
                      Viewing in {viewMode} mode
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full">
                  <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-700">
                        {activeTool.charAt(0).toUpperCase() + activeTool.slice(1)} Editor
                      </h3>
                      <div className="text-xs text-gray-500 bg-white px-2 py-1 rounded">
                        {viewMode}
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    {renderToolContent()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default EditorLayout;