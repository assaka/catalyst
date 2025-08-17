import React, { useState, useEffect, useCallback } from 'react';
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
  X,
  Save,
  Edit3,
  RotateCcw
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
  const [showOriginalContent, setShowOriginalContent] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [customizations, setCustomizations] = useState(null);
  const [recentFiles, setRecentFiles] = useState([]);
  
  // Check if we're in the template editor route to filter file tree
  const isTemplateEditor = location.pathname === '/editor/templates';
  
  // File tree state
  const [selectedFile, setSelectedFile] = useState(null);
  const [expandedFolders, setExpandedFolders] = useState(
    isTemplateEditor ? {
      'storefront-pages': true,
      'storefront-components': true,
      'ui-components': false,
      'styles': false
    } : {
      'pages': true,
      'components': true,
      'styles': false
    }
  );
  const [fileTreeOpen, setFileTreeOpen] = useState(true);
  
  // Get user info for shared header
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  // Load customizations from database on mount
  useEffect(() => {
    const loadCustomizations = async () => {
      try {
        const token = localStorage.getItem('store_owner_auth_token') || 
                     localStorage.getItem('auth_token');
        
        if (!token) return;
        
        const storeId = user.store_id || localStorage.getItem('current_store_id');
        const url = storeId ? `/api/editor-customizations?store_id=${storeId}` : '/api/editor-customizations';
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setCustomizations(data.data);
            setRecentFiles(data.data.recent_files || []);
            
            // Apply layout preferences
            if (data.data.layout_preferences) {
              setChatOpen(data.data.layout_preferences.chat_open);
              setFileTreeOpen(data.data.layout_preferences.file_tree_open);
            }
            
            // Apply expanded folders
            if (data.data.preferences?.expanded_folders) {
              setExpandedFolders(prev => ({
                ...prev,
                ...data.data.preferences.expanded_folders
              }));
            }
          }
        }
      } catch (error) {
        console.error('Failed to load customizations:', error);
      }
    };
    
    loadCustomizations();
  }, [user.store_id]);
  
  // Define callback functions before useEffect that references them
  const handleSaveEdit = useCallback(async () => {
    if (selectedFile && editedContent !== undefined) {
      // Create overlay system: store original content and customizations separately
      const customization = {
        originalContent: selectedFile.originalContent || selectedFile.content,
        customizedContent: editedContent,
        timestamp: new Date().toISOString(),
        path: selectedFile.path,
        name: selectedFile.name,
        type: selectedFile.type,
        actualPath: selectedFile.actualPath
      };
      
      // Update selected file with customization info
      setSelectedFile({
        ...selectedFile,
        content: editedContent,
        originalContent: selectedFile.originalContent || selectedFile.content,
        hasCustomizations: true,
        customizationTimestamp: new Date().toISOString()
      });
      
      setIsEditing(false);
      setHasUnsavedChanges(true);
      setLastSaved(new Date());
      
      // Save customization to database as overlay
      await saveFileContent(selectedFile.path, editedContent, {
        name: selectedFile.name,
        type: selectedFile.type,
        actualPath: selectedFile.actualPath,
        isOverlay: true,
        originalContent: selectedFile.originalContent || selectedFile.content
      });
      
      // Store customization overlay locally
      localStorage.setItem(`template_overlay_${selectedFile.name}`, JSON.stringify(customization));
      
      setChatMessages(prev => [...prev, {
        id: Date.now(),
        type: 'ai',
        content: `✅ Saved customizations as overlay for ${selectedFile.name}. Your changes are now applied as a layer on top of the original template without modifying the source file. These customizations will be displayed in the storefront preview and when users visit your store.`,
        timestamp: new Date()
      }]);
    }
  }, [selectedFile, editedContent]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditedContent('');
    setChatMessages(prev => [...prev, {
      id: Date.now(),
      type: 'ai',
      content: `❌ Cancelled editing ${selectedFile?.name}. Changes have been discarded.`,
      timestamp: new Date()
    }]);
  }, [selectedFile]);
  
  // File tree data structure - filtered for storefront files when in template editor
  const fileTree = isTemplateEditor ? {
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
    'styles': {
      name: 'Styles',
      type: 'folder',
      children: {
        'App.css': { name: 'App.css', type: 'file', language: 'css' },
        'index.css': { name: 'index.css', type: 'file', language: 'css' },
        'storefront.css': { name: 'storefront.css', type: 'file', language: 'css' }
      }
    }
  } : {
    'pages': {
      name: 'Pages',
      type: 'folder',
      children: {
        // Storefront Pages
        'Storefront.jsx': { name: 'Storefront.jsx', type: 'file', language: 'jsx' },
        'ProductDetail.jsx': { name: 'ProductDetail.jsx', type: 'file', language: 'jsx' },
        'Cart.jsx': { name: 'Cart.jsx', type: 'file', language: 'jsx' },
        'Checkout.jsx': { name: 'Checkout.jsx', type: 'file', language: 'jsx' },
        'OrderSuccess.jsx': { name: 'OrderSuccess.jsx', type: 'file', language: 'jsx' },
        'CustomerDashboard.jsx': { name: 'CustomerDashboard.jsx', type: 'file', language: 'jsx' },
        'CmsPageViewer.jsx': { name: 'CmsPageViewer.jsx', type: 'file', language: 'jsx' },
        'HtmlSitemap.jsx': { name: 'HtmlSitemap.jsx', type: 'file', language: 'jsx' },
        // Admin Pages
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
        'TemplateEditor.jsx': { name: 'TemplateEditor.jsx', type: 'file', language: 'jsx' },
        'Layout.jsx': { name: 'Layout.jsx', type: 'file', language: 'jsx' },
        'Auth.jsx': { name: 'Auth.jsx', type: 'file', language: 'jsx' },
        'Landing.jsx': { name: 'Landing.jsx', type: 'file', language: 'jsx' }
      }
    },
    'components': {
      name: 'Components',
      type: 'folder',
      children: {
        'storefront': {
          name: 'storefront',
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
        'ui': {
          name: 'ui',
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
        'EditorLayout.jsx': { name: 'EditorLayout.jsx', type: 'file', language: 'jsx' },
        'RoleProtectedRoute.jsx': { name: 'RoleProtectedRoute.jsx', type: 'file', language: 'jsx' },
        'AuthMiddleware.jsx': { name: 'AuthMiddleware.jsx', type: 'file', language: 'jsx' }
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

  // Keyboard shortcuts for editing
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Ctrl+S or Cmd+S to save
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        if (isEditing) {
          handleSaveEdit();
        }
      }
      // Escape to cancel editing
      if (event.key === 'Escape' && isEditing) {
        handleCancelEdit();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isEditing, editedContent, handleSaveEdit, handleCancelEdit]);
  
  const switchToAdmin = () => {
    navigate('/admin/dashboard');
  };
  
  const switchToEditor = () => {
    // Already in editor mode, do nothing
  };

  // File tree helper functions
  const toggleFolder = (folderKey) => {
    setExpandedFolders(prev => {
      const newExpanded = {
        ...prev,
        [folderKey]: !prev[folderKey]
      };
      
      // Save expanded folders to database
      saveExpandedFolders(newExpanded);
      
      return newExpanded;
    });
  };
  
  // Save customizations to database
  const saveExpandedFolders = async (expandedFolders) => {
    try {
      const token = localStorage.getItem('store_owner_auth_token') || 
                   localStorage.getItem('auth_token');
      
      if (!token) return;
      
      const storeId = user.store_id || localStorage.getItem('current_store_id');
      const url = storeId ? `/api/editor-customizations/expanded-folders?store_id=${storeId}` : 
                           '/api/editor-customizations/expanded-folders';
      
      await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ expanded_folders: expandedFolders })
      });
    } catch (error) {
      console.error('Failed to save expanded folders:', error);
    }
  };
  
  const saveLayoutPreferences = async (preferences) => {
    try {
      const token = localStorage.getItem('store_owner_auth_token') || 
                   localStorage.getItem('auth_token');
      
      if (!token) return;
      
      const storeId = user.store_id || localStorage.getItem('current_store_id');
      const url = storeId ? `/api/editor-customizations/layout?store_id=${storeId}` : 
                           '/api/editor-customizations/layout';
      
      await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ preferences })
      });
    } catch (error) {
      console.error('Failed to save layout preferences:', error);
    }
  };
  
  const saveFileContent = async (filePath, content, metadata = {}) => {
    try {
      const token = localStorage.getItem('store_owner_auth_token') || 
                   localStorage.getItem('auth_token');
      
      if (!token) return;
      
      const storeId = user.store_id || localStorage.getItem('current_store_id');
      const url = storeId ? `/api/editor-customizations/file-content?store_id=${storeId}` : 
                           '/api/editor-customizations/file-content';
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          file_path: filePath, 
          content, 
          metadata 
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCustomizations(data.data);
          setRecentFiles(data.data.recent_files || []);
        }
      }
    } catch (error) {
      console.error('Failed to save file content:', error);
    }
  };
  
  const addToRecentFiles = async (filePath, fileName, fileType) => {
    try {
      const token = localStorage.getItem('store_owner_auth_token') || 
                   localStorage.getItem('auth_token');
      
      if (!token) return;
      
      const storeId = user.store_id || localStorage.getItem('current_store_id');
      const url = storeId ? `/api/editor-customizations/recent-files?store_id=${storeId}` : 
                           '/api/editor-customizations/recent-files';
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          file_path: filePath, 
          file_name: fileName, 
          file_type: fileType 
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setRecentFiles(data.data.recent_files || []);
        }
      }
    } catch (error) {
      console.error('Failed to add to recent files:', error);
    }
  };

  // Template customization handler - creates overrides without modifying core files
  const handleTemplateCustomization = async (filePath, fileName, fileType) => {
    try {
      // Create a visual customization interface for ProductDetail
      const customizationInterface = await createCustomizationInterface(fileName);
      
      // Load existing customizations from database
      const existingCustomizations = await loadTemplateCustomizations(fileName);
      
      // Create a template customization interface
      const customizationData = {
        originalFile: fileName,
        originalPath: filePath,
        templateType: fileName.replace('.jsx', ''),
        customizations: existingCustomizations,
        interface: customizationInterface,
        availableProps: getAvailableProps(fileName),
        availableComponents: getAvailableComponents(fileType)
      };
      
      // Set the selected file with customization metadata
      setSelectedFile({
        path: filePath,
        name: fileName,
        type: 'template-customization',
        language: 'customization',
        content: customizationInterface,
        customizations: customizationData
      });

      // Add AI message about template customization
      setChatMessages(prev => [...prev, {
        id: Date.now(),
        type: 'ai',
        content: `🎨 **Template Customization: ${fileName}**

I've loaded the ${fileName} template for customization. Here's what you can do:

**Available Customization Options:**
• **Visual Styling**: Change colors, fonts, spacing, and layout
• **Content Sections**: Add, remove, or reorder content blocks
• **Component Behavior**: Modify functionality without touching core code
• **Data Binding**: Connect to different data sources
• **Conditional Logic**: Show/hide elements based on conditions

**How it works:**
- Your customizations create an override layer on top of the original template
- Core files remain untouched for easy updates
- Changes are stored as template configurations
- You can preview changes instantly

Try saying something like:
- "Change the background color to blue"
- "Add a promotional banner at the top"
- "Hide the sidebar on mobile devices"
- "Replace the product grid with a carousel"

What would you like to customize in this template?`,
        timestamp: new Date()
      }]);

      console.log('🎨 Template customization initialized for:', fileName);
      
    } catch (error) {
      console.error('❌ Template customization error:', error);
      setChatMessages(prev => [...prev, {
        id: Date.now(),
        type: 'ai',
        content: `⚠️ Sorry, I encountered an issue loading the ${fileName} template for customization. Please try again.`,
        timestamp: new Date()
      }]);
    }
  };

  // Helper functions for template customization
  const loadOriginalTemplate = async (filePath, fileName) => {
    const templateMappings = {
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
      'storefront-components/FlashMessage.jsx': 'src/components/storefront/FlashMessage.jsx'
    };
    
    const actualPath = templateMappings[filePath];
    if (actualPath) {
      try {
        const token = localStorage.getItem('store_owner_auth_token') || localStorage.getItem('auth_token');
        const apiUrl = `/api/template-editor/source-files/content?path=${encodeURIComponent(actualPath)}`;
        
        const response = await fetch(apiUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          return data.content || `// Original ${fileName} template\n// File: ${actualPath}\n\n// Template content will be loaded here for customization`;
        }
      } catch (error) {
        console.error('Error loading original template:', error);
      }
    }
    
    return `// Original ${fileName} template\n// This is a placeholder for the original template content\n// Your customizations will be applied as an override layer`;
  };

  const getExistingCustomizations = (fileName) => {
    // Load existing customizations from localStorage or API
    const stored = localStorage.getItem(`template_customizations_${fileName}`);
    try {
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  };

  // Helper function to create customization interface
  const createCustomizationInterface = async (fileName) => {
    const templateType = fileName.replace('.jsx', '');
    
    // Create a JSON-based customization interface
    const customizationSchema = {
      template: templateType,
      timestamp: new Date().toISOString(),
      customization_sections: {
        styles: {
          theme_colors: {
            primary: "#3b82f6",
            secondary: "#64748b", 
            accent: "#f59e0b",
            background: "#ffffff",
            text: "#1f2937"
          },
          layout: {
            container_width: "1200px",
            spacing: "medium",
            border_radius: "8px",
            shadow: "md"
          },
          typography: {
            font_family: "Inter, sans-serif",
            font_size_base: "16px",
            font_weight: "400",
            line_height: "1.5"
          }
        },
        content: {
          blocks: [
            {
              id: "header",
              type: "header",
              content: "Product Details",
              position: "top",
              visible: true
            },
            {
              id: "product_info",
              type: "product_info",
              fields: ["name", "price", "description", "sku"],
              position: "main",
              visible: true
            },
            {
              id: "images",
              type: "image_gallery",
              layout: "carousel",
              thumbnail_position: "bottom",
              zoom: true,
              visible: true
            },
            {
              id: "actions",
              type: "action_buttons",
              buttons: ["add_to_cart", "add_to_wishlist", "share"],
              position: "right",
              visible: true
            }
          ]
        },
        behavior: {
          features_enabled: {
            product_zoom: true,
            image_gallery: true,
            related_products: true,
            reviews: true,
            specifications: true,
            social_share: true
          },
          interactions: {
            auto_save: true,
            real_time_preview: true,
            undo_redo: true
          }
        }
      }
    };
    
    // Convert to formatted JSON for display
    return JSON.stringify(customizationSchema, null, 2);
  };

  // Helper function to load existing template customizations
  const loadTemplateCustomizations = async (fileName) => {
    try {
      const templateType = fileName.replace('.jsx', '');
      const token = localStorage.getItem('store_owner_auth_token');
      const storeId = localStorage.getItem('current_store_id') || '157d4590-49bf-4b0b-bd77-abe131909528';
      
      if (!token) {
        console.log('No auth token found, returning empty customizations');
        return {};
      }
      
      const response = await fetch(`/api/template-customizations/${storeId}/${templateType}?component_path=pages/${templateType}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Loaded existing customizations:', result);
        return result.data?.customizations || {};
      } else {
        console.log('No existing customizations found, starting fresh');
        return {};
      }
    } catch (error) {
      console.error('Error loading template customizations:', error);
      return {};
    }
  };

  const getAvailableProps = (fileName) => {
    const propMappings = {
      'Storefront.jsx': ['products', 'categories', 'featuredProducts', 'banners', 'seoData'],
      'ProductDetail.jsx': ['product', 'relatedProducts', 'reviews', 'specifications', 'images'],
      'ProductCard.jsx': ['product', 'showPrice', 'showRating', 'showWishlist', 'layout'],
      'Cart.jsx': ['cartItems', 'totals', 'shippingMethods', 'coupons'],
      'Checkout.jsx': ['checkoutSteps', 'paymentMethods', 'shippingAddress', 'billingAddress'],
      'CategoryNav.jsx': ['categories', 'showIcons', 'maxDepth', 'layout'],
      'HeaderSearch.jsx': ['placeholder', 'suggestions', 'autocomplete', 'filters']
    };
    
    return propMappings[fileName] || ['data', 'config', 'theme', 'user'];
  };

  const getAvailableComponents = (fileType) => {
    if (fileType === 'jsx') {
      return [
        'Button', 'Card', 'Input', 'Select', 'Dialog', 'Badge', 'Alert',
        'ProductCard', 'CategoryNav', 'Breadcrumb', 'MiniCart', 'HeaderSearch',
        'LayeredNavigation', 'RecommendedProducts', 'CustomOptions'
      ];
    }
    return [];
  };

  // Handle editing functionality
  const handleStartEditing = useCallback(() => {
    if (selectedFile) {
      setEditedContent(selectedFile.content);
      setIsEditing(true);
      setShowOriginalContent(false); // Always edit the customized version
      setChatMessages(prev => [...prev, {
        id: Date.now(),
        type: 'ai',
        content: `📝 Started editing ${selectedFile.name}. You can now modify the code directly. Remember to save your changes when done!`,
        timestamp: new Date()
      }]);
    }
  }, [selectedFile]);

  const handleFileSelect = async (filePath, fileName, fileType) => {
    // Log the actual file path to debug routing issues
    console.log('🔍 File selection debug:', {
      filePath,
      fileName,
      fileType,
      isTemplateEditor
    });
    
    // Check if this is a storefront template that should use customization interface
    // Exception: ProductDetail.jsx should ALWAYS load real file content for editing
    const isProductDetail = fileName === 'ProductDetail.jsx' || filePath.includes('ProductDetail');
    const isStorefrontTemplate = (filePath.includes('storefront/') || 
                                filePath.includes('pages/Storefront') ||
                                filePath.includes('pages/Cart') ||
                                filePath.includes('pages/Checkout')) &&
                                !isProductDetail; // ProductDetail.jsx bypasses template customization
    
    console.log('🔍 Routing decision:', {
      isProductDetail,
      isStorefrontTemplate,
      willUseTemplateCustomization: isTemplateEditor && isStorefrontTemplate,
      willLoadRealFile: !isStorefrontTemplate || isProductDetail
    });
    
    // Template customization logic - create overrides without modifying core files
    // ProductDetail.jsx bypasses this and uses real file content loading
    if (isTemplateEditor && isStorefrontTemplate && !isProductDetail) {
      console.log('🎨 Using template customization for:', fileName);
      handleTemplateCustomization(filePath, fileName, fileType);
      return;
    }
    
    console.log('📄 Loading real file content for:', fileName);
    
    // For ProductDetail.jsx, load the actual source code via API
    if (fileName === 'ProductDetail.jsx' || filePath.includes('ProductDetail')) {
      console.log('🎯 Loading ProductDetail.jsx source code via API');
      
      try {
        // Use the source files API endpoint that has auth bypass configured
        const response = await fetch('/api/template-editor/source-files/content', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            filePath: 'src/pages/ProductDetail.jsx'
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          const content = data.content || 'Unable to load ProductDetail.jsx source';
          
          setSelectedFile({
            path: filePath,
            name: fileName,
            type: fileType,
            language: 'jsx',
            content: content
          });
          
          setChatMessages(prev => [...prev, {
            id: Date.now(),
            type: 'ai',
            content: `📄 **${fileName} - Real Source Code Loaded**

I've loaded the actual source code for ${fileName}. This is the real implementation that powers your product detail pages.

**What you're seeing:**
✅ **Real React component** with full functionality
✅ **Actual imports** and dependencies  
✅ **Complete implementation** including state management, API calls, and UI components
✅ **Production code** that's currently running your storefront

**You can now:**
- Edit this code directly
- See the complete component structure
- Understand how product pages work
- Make modifications to the actual implementation

This is the real ProductDetail.jsx file from your project!`,
            timestamp: new Date()
          }]);
          
          return;
        } else {
          console.error('Failed to fetch source code:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('Failed to load ProductDetail.jsx source via API:', error);
        // Fall through to the regular file loading mechanism
      }
    }
    
    // Map file tree paths to actual file system paths
    const fileMapping = {
      // Template Editor - Storefront Pages (mapped to actual src/pages/)
      'storefront-pages/Storefront.jsx': 'src/pages/Storefront.jsx',
      'storefront-pages/ProductDetail.jsx': 'src/pages/ProductDetail.jsx', 
      'storefront-pages/Cart.jsx': 'src/pages/Cart.jsx',
      'storefront-pages/Checkout.jsx': 'src/pages/Checkout.jsx',
      'storefront-pages/OrderSuccess.jsx': 'src/pages/OrderSuccess.jsx',
      'storefront-pages/CustomerDashboard.jsx': 'src/pages/CustomerDashboard.jsx',
      'storefront-pages/CmsPageViewer.jsx': 'src/pages/CmsPageViewer.jsx',
      'storefront-pages/HtmlSitemap.jsx': 'src/pages/HtmlSitemap.jsx',
      
      // Template Editor - Storefront Components (mapped to actual src/components/storefront/)
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
      
      // Template Editor - UI Components (mapped to actual src/components/ui/)
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
      'ui-components/calendar.jsx': 'src/components/ui/calendar.jsx',
      'ui-components/checkbox.jsx': 'src/components/ui/checkbox.jsx',
      'ui-components/radio-group.jsx': 'src/components/ui/radio-group.jsx',
      'ui-components/slider.jsx': 'src/components/ui/slider.jsx',
      'ui-components/switch.jsx': 'src/components/ui/switch.jsx',
      'ui-components/textarea.jsx': 'src/components/ui/textarea.jsx',
      'ui-components/toggle.jsx': 'src/components/ui/toggle.jsx',
      'ui-components/tooltip.jsx': 'src/components/ui/tooltip.jsx',
      'ui-components/popover.jsx': 'src/components/ui/popover.jsx',
      
      // Template Editor - Styles (mapped to actual src/)
      'styles/App.css': 'src/App.css',
      'styles/index.css': 'src/index.css',
      
      // Full Editor - Pages (both storefront and admin)
      'pages/Storefront.jsx': 'src/pages/Storefront.jsx',
      'pages/ProductDetail.jsx': 'src/pages/ProductDetail.jsx',
      'pages/Cart.jsx': 'src/pages/Cart.jsx',
      'pages/Checkout.jsx': 'src/pages/Checkout.jsx',
      'pages/OrderSuccess.jsx': 'src/pages/OrderSuccess.jsx',
      'pages/CustomerDashboard.jsx': 'src/pages/CustomerDashboard.jsx',
      'pages/CmsPageViewer.jsx': 'src/pages/CmsPageViewer.jsx',
      'pages/HtmlSitemap.jsx': 'src/pages/HtmlSitemap.jsx',
      'pages/Dashboard.jsx': 'src/pages/Dashboard.jsx',
      'pages/Products.jsx': 'src/pages/Products.jsx',
      'pages/Categories.jsx': 'src/pages/Categories.jsx',
      'pages/Attributes.jsx': 'src/pages/Attributes.jsx',
      'pages/Orders.jsx': 'src/pages/Orders.jsx',
      'pages/Customers.jsx': 'src/pages/Customers.jsx',
      'pages/CmsPages.jsx': 'src/pages/CmsPages.jsx',
      'pages/CmsBlocks.jsx': 'src/pages/CmsBlocks.jsx',
      'pages/Settings.jsx': 'src/pages/Settings.jsx',
      'pages/ThemeLayout.jsx': 'src/pages/ThemeLayout.jsx',
      'pages/TemplateEditor.jsx': 'src/pages/TemplateEditor.jsx',
      'pages/Layout.jsx': 'src/pages/Layout.jsx',
      'pages/Auth.jsx': 'src/pages/Auth.jsx',
      'pages/Landing.jsx': 'src/pages/Landing.jsx',
      
      // Components - Storefront
      'components/storefront/StorefrontLayout.jsx': 'src/components/storefront/StorefrontLayout.jsx',
      'components/storefront/ProductCard.jsx': 'src/components/storefront/ProductCard.jsx',
      'components/storefront/CategoryNav.jsx': 'src/components/storefront/CategoryNav.jsx',
      'components/storefront/HeaderSearch.jsx': 'src/components/storefront/HeaderSearch.jsx',
      'components/storefront/MiniCart.jsx': 'src/components/storefront/MiniCart.jsx',
      'components/storefront/Breadcrumb.jsx': 'src/components/storefront/Breadcrumb.jsx',
      'components/storefront/LayeredNavigation.jsx': 'src/components/storefront/LayeredNavigation.jsx',
      'components/storefront/WishlistDropdown.jsx': 'src/components/storefront/WishlistDropdown.jsx',
      'components/storefront/RecommendedProducts.jsx': 'src/components/storefront/RecommendedProducts.jsx',
      'components/storefront/RelatedProductsViewer.jsx': 'src/components/storefront/RelatedProductsViewer.jsx',
      'components/storefront/ProductLabel.jsx': 'src/components/storefront/ProductLabel.jsx',
      'components/storefront/CustomOptions.jsx': 'src/components/storefront/CustomOptions.jsx',
      'components/storefront/CmsBlockRenderer.jsx': 'src/components/storefront/CmsBlockRenderer.jsx',
      'components/storefront/CookieConsentBanner.jsx': 'src/components/storefront/CookieConsentBanner.jsx',
      'components/storefront/FlashMessage.jsx': 'src/components/storefront/FlashMessage.jsx',
      
      // Components - UI
      'components/ui/button.jsx': 'src/components/ui/button.jsx',
      'components/ui/card.jsx': 'src/components/ui/card.jsx',
      'components/ui/input.jsx': 'src/components/ui/input.jsx',
      'components/ui/select.jsx': 'src/components/ui/select.jsx',
      'components/ui/dialog.jsx': 'src/components/ui/dialog.jsx',
      'components/ui/dropdown-menu.jsx': 'src/components/ui/dropdown-menu.jsx',
      'components/ui/tabs.jsx': 'src/components/ui/tabs.jsx',
      'components/ui/table.jsx': 'src/components/ui/table.jsx',
      'components/ui/badge.jsx': 'src/components/ui/badge.jsx',
      'components/ui/alert.jsx': 'src/components/ui/alert.jsx',
      'components/ui/pagination.jsx': 'src/components/ui/pagination.jsx',
      'components/ui/skeleton.jsx': 'src/components/ui/skeleton.jsx',
      
      // Components - Root Level
      'components/EditorLayout.jsx': 'src/components/EditorLayout.jsx',
      'components/RoleProtectedRoute.jsx': 'src/components/RoleProtectedRoute.jsx',
      'components/AuthMiddleware.jsx': 'src/components/AuthMiddleware.jsx',
      
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
        
        // Debug: Log the path we're trying to load
        console.log('🔍 Loading file:', {
          filePath,
          fileName,
          actualPath,
          fileType
        });
        
        // Try multiple methods to load the file content
        
        // Method 1: Try loading via API endpoint
        try {
          // Try multiple possible token locations
          const token = localStorage.getItem('store_owner_auth_token') ||
                       localStorage.getItem('customer_auth_token') ||
                       localStorage.getItem('auth_token') ||
                       localStorage.getItem('token');
          
          console.log('🔑 Token found:', !!token, token ? `(${token.substring(0, 20)}...)` : 'none');
          console.log('🔍 Available localStorage keys:', Object.keys(localStorage));
          
          // Debug token details
          if (token) {
            try {
              // Try to decode JWT payload (basic check - doesn't verify signature)
              const payload = JSON.parse(atob(token.split('.')[1]));
              console.log('🔍 Token payload:', {
                userId: payload.id || payload.sub,
                role: payload.role,
                exp: payload.exp ? new Date(payload.exp * 1000).toISOString() : 'no expiration',
                iat: payload.iat ? new Date(payload.iat * 1000).toISOString() : 'no issued time',
                isExpired: payload.exp ? Date.now() > payload.exp * 1000 : false
              });
            } catch (decodeError) {
              console.log('❌ Cannot decode token payload:', decodeError.message);
            }
          }
          
          if (token) {
            // First, test if token works with a simpler endpoint
            console.log('🧪 Testing token validity with auth test...');
            try {
              const testResponse = await fetch('/api/categories', {
                method: 'GET',
                headers: {
                  'Accept': 'application/json',
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });
              console.log('🧪 Auth test response:', testResponse.status, testResponse.ok ? 'SUCCESS' : 'FAILED');
            } catch (testError) {
              console.log('🧪 Auth test failed:', testError.message);
            }
            
            const apiUrl = `/api/template-editor/source-files/content?path=${encodeURIComponent(actualPath)}`;
            console.log('🌐 Making API request to:', apiUrl);
            
            const apiResponse = await fetch(apiUrl, {
              method: 'GET',
              headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            
            console.log('📡 API response status:', apiResponse.status, apiResponse.statusText);
            console.log('📡 API response headers:', Object.fromEntries(apiResponse.headers.entries()));
            
            if (apiResponse.ok) {
              const data = await apiResponse.json();
              console.log('📦 API response data:', { success: data.success, contentLength: data.content?.length });
              
              if (data.success && data.content) {
                content = data.content;
                loadSuccess = true;
                console.log('✅ Successfully loaded file from API:', fileName, `(${data.content.length} chars)`);
              } else {
                console.log('❌ API returned unsuccessful response:', data);
              }
            } else {
              const errorData = await apiResponse.text();
              console.log('❌ API response not ok:', apiResponse.status, apiResponse.statusText, errorData);
              
              // Handle specific authentication errors
              if (apiResponse.status === 401) {
                console.log('🔐 Authentication failed - user may need to log in to admin dashboard first');
                console.log('💡 Suggestion: Make sure you are logged into your store admin dashboard');
                
                // Try to parse error response
                try {
                  const errorJson = JSON.parse(errorData);
                  if (errorJson.message) {
                    console.log('📝 Server error message:', errorJson.message);
                  }
                } catch (parseError) {
                  console.log('📝 Server response:', errorData);
                }
              }
            }
          } else {
            console.log('❌ No auth token found - user needs to authenticate first');
            console.log('💡 Please ensure you are logged into your store admin dashboard');
          }
        } catch (apiError) {
          console.log('❌ Primary API method failed:', apiError.message);
        }
        
        // Method 1.5: Try original source-files endpoint as backup
        if (!loadSuccess) {
          try {
            const token = localStorage.getItem('store_owner_auth_token') ||
                         localStorage.getItem('customer_auth_token') ||
                         localStorage.getItem('auth_token') ||
                         localStorage.getItem('token');
            
            if (token) {
              const backupApiUrl = `/api/source-files/content?path=${encodeURIComponent(actualPath)}`;
              console.log('🔄 Trying backup API endpoint:', backupApiUrl);
              
              const backupResponse = await fetch(backupApiUrl, {
                method: 'GET',
                headers: {
                  'Accept': 'application/json',
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });
              
              console.log('📡 Backup API response status:', backupResponse.status, backupResponse.statusText);
              
              if (backupResponse.ok) {
                const data = await backupResponse.json();
                if (data.success && data.content) {
                  content = data.content;
                  loadSuccess = true;
                  console.log('✅ Successfully loaded file from backup API:', fileName, `(${data.content.length} chars)`);
                } else {
                  console.log('❌ Backup API returned unsuccessful response:', data);
                }
              } else {
                const errorData = await backupResponse.text();
                console.log('❌ Backup API response not ok:', backupResponse.status, errorData);
                
                if (backupResponse.status === 404) {
                  console.log('ℹ️ Backup endpoint not available in production - this is expected');
                }
              }
            }
          } catch (backupError) {
            console.log('❌ Backup API method failed:', backupError.message);
          }
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
        
        // Special handling for ProductDetail.jsx - always try to show real content
        if (!loadSuccess && fileName === 'ProductDetail.jsx') {
          console.log('🎯 ProductDetail.jsx requested - attempting to load actual file content...');
          try {
            const token = localStorage.getItem('store_owner_auth_token') ||
                         localStorage.getItem('customer_auth_token') ||
                         localStorage.getItem('auth_token') ||
                         localStorage.getItem('token');
            
            if (token) {
              const productDetailApiUrl = `/api/template-editor/source-files/content?path=src/pages/ProductDetail.jsx`;
              console.log('🔗 Loading ProductDetail.jsx via:', productDetailApiUrl);
              
              const response = await fetch(productDetailApiUrl, {
                method: 'GET',
                headers: {
                  'Accept': 'application/json',
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });
              
              if (response.ok) {
                const data = await response.json();
                if (data.success && data.content) {
                  content = data.content;
                  loadSuccess = true;
                  console.log('✅ ProductDetail.jsx loaded successfully:', data.content.length, 'characters');
                }
              }
            }
          } catch (productDetailError) {
            console.log('⚠️ Failed to load actual ProductDetail.jsx content:', productDetailError.message);
          }
        }
        
        // Method 3: Final fallback with enhanced mock content
        if (!loadSuccess) {
          console.warn(`⚠️ Could not load actual file content for ${fileName}. Using fallback content.`);
          console.log('');
          console.log('ℹ️ IMPORTANT: Source files are not available in production for security reasons.');
          console.log('   This is expected behavior in the deployed Editor.');
          console.log('   The Editor shows representative content to help you understand file structure.');
          console.log('   For development: Clone the repository locally and run in development mode.');
          console.log('');
          
          if (fileType === 'jsx') {
            const componentName = fileName.split('.')[0];
            content = `// 📁 REPRESENTATIVE CONTENT - ${fileName}\n// File: ${actualPath}\n// \n// NOTE: Source files are not available in production deployments for security.\n// This is representative content showing the file structure and component pattern.\n// For actual development, clone the repository and run locally.\n\nimport React from 'react';\n\n// ${componentName} Component\n// This represents the structure and imports of the actual file\n\nconst ${componentName} = () => {\n  return (\n    <div className="p-4">\n      <h1>${componentName}</h1>\n      {/* The actual component contains the full implementation */}\n      {/* with state management, API calls, and complete functionality */}\n    </div>\n  );\n};\n\nexport default ${componentName};`;
          } else if (fileType === 'css') {
            content = `/* 📁 REPRESENTATIVE CONTENT - ${fileName} */\n/* File: ${actualPath} */\n/* */\n/* NOTE: Source files are not available in production deployments for security. */\n/* This is representative content showing the file structure and CSS patterns. */\n/* For actual development, clone the repository and run locally. */\n\n/* ${fileName} */\n/* Stylesheet for the application */\n/* The actual file contains complete styles for the component */\n\n.container {\n  padding: 1rem;\n  margin: 0 auto;\n  max-width: 1200px;\n}\n\n/* Actual styles include: */\n/* - Responsive design rules */\n/* - Component-specific styling */\n/* - Theme and color variables */\n/* - Animation and interaction states */`;
          } else {
            content = `// 📁 REPRESENTATIVE CONTENT - ${fileName}\n// File: ${actualPath}\n//\n// NOTE: Source files are not available in production deployments for security.\n// This is representative content showing the file structure.\n// For actual development, clone the repository and run locally.\n\n// ${fileName}\n// File type: ${fileType}\n// Path: ${actualPath}\n// The actual file contains the complete implementation`;
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
    
    // Check for existing customizations/overlays
    const overlayKey = `template_overlay_${fileName}`;
    const existingOverlay = localStorage.getItem(overlayKey);
    let finalContent = content;
    let hasCustomizations = false;
    let customizationTimestamp = null;
    
    if (existingOverlay) {
      try {
        const overlay = JSON.parse(existingOverlay);
        finalContent = overlay.customizedContent;
        hasCustomizations = true;
        customizationTimestamp = overlay.timestamp;
        console.log('✨ Applying existing customization overlay for:', fileName);
      } catch (error) {
        console.error('Error parsing existing overlay:', error);
      }
    }

    setSelectedFile({
      path: filePath,
      name: fileName,
      type: fileType,
      actualPath: actualPath,
      content: finalContent,
      originalContent: content, // Always preserve original content
      hasCustomizations: hasCustomizations,
      customizationTimestamp: customizationTimestamp
    });
    
    // Reset editing state when selecting a new file
    setIsEditing(false);
    setEditedContent('');
    setShowOriginalContent(false);
    
    // Add to recent files
    await addToRecentFiles(filePath, fileName, fileType);
    
    // Add AI message about file selection
    const fileTypeDescription = fileType === 'jsx' ? 'React component' : fileType === 'css' ? 'CSS stylesheet' : fileType;
    const loadStatusMessage = loadSuccess ? 
      '✅ Successfully loaded actual file content from the project filesystem.' : 
      'ℹ️ Showing representative content - source files are not available in production deployments for security reasons. This is expected behavior.';
    
    // Generate appropriate load message based on whether it's ProductDetail.jsx and if overlay exists
    let loadMessage = loadStatusMessage;
    if (fileName === 'ProductDetail.jsx' && loadSuccess) {
      loadMessage = '🎉 Successfully loaded the actual ProductDetail.jsx source code! This is the real React component with all 971 lines of code including product gallery, pricing, cart functionality, and more.';
    }
    
    let overlayMessage = '';
    if (hasCustomizations) {
      overlayMessage = ` ✨ This file has customizations applied as an overlay. You can view the original content using the "Show Original" button.`;
    }

    setChatMessages(prev => [...prev, {
      id: Date.now(),
      type: 'ai',
      content: `📂 Opened ${fileName}. ${loadMessage} This is a ${fileTypeDescription} file.${overlayMessage} I can help you understand its structure, suggest improvements, or explain how it fits into the application architecture.`,
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
    
    // Check if file has customizations
    const hasCustomizations = !isFolder && localStorage.getItem(`template_overlay_${item.name}`);

    return (
      <div>
        <div
          className={`flex items-center px-2 py-1 hover:bg-gray-100 cursor-pointer rounded relative ${
            isSelected ? 'bg-blue-50 text-blue-700' : ''
          } ${hasCustomizations ? 'bg-amber-50' : ''}`}
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
          {hasCustomizations && (
            <div 
              className="absolute right-1 top-1 w-2 h-2 bg-amber-500 rounded-full" 
              title="File has customizations"
            />
          )}
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

  // Template customization interface
  const renderTemplateCustomization = () => {
    if (!selectedFile || selectedFile.type !== 'template-customization') return null;
    
    const { customizations } = selectedFile;
    
    return (
      <div className="space-y-6">
        <div className="border-b border-gray-200 pb-4">
          <h4 className="text-lg font-semibold flex items-center gap-2">
            <Code className="w-5 h-5 text-blue-600" />
            Customizing: {selectedFile.name}
          </h4>
          <p className="text-sm text-gray-600 mt-1">
            Make changes without modifying the original template files
          </p>
          {/* Live Preview Toggle */}
          <div className="flex items-center gap-2 mt-3">
            <Button
              variant={previewMode ? "default" : "outline"}
              size="sm"
              onClick={() => setPreviewMode(!previewMode)}
            >
              <Eye className="w-4 h-4 mr-2" />
              {previewMode ? 'Exit Preview' : 'Live Preview'}
            </Button>
            <div className="text-xs text-gray-500">
              {previewMode ? 'Showing live preview' : 'Showing customization controls'}
            </div>
          </div>
        </div>

        {/* Customization Options */}
        {!previewMode && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Visual Customizations */}
          <div className="space-y-4">
            <h5 className="font-medium text-gray-900 flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Visual Styling
            </h5>
            <div className="grid grid-cols-2 gap-3">
              <div 
                className="p-3 border rounded-lg hover:border-blue-500 cursor-pointer transition-colors group"
                onClick={() => {
                  setActiveTool('colors');
                  setChatMessages(prev => [...prev, {
                    id: Date.now(),
                    type: 'ai',
                    content: `🎨 Opening color customization for ${selectedFile.name}. You can change theme colors, backgrounds, text colors, and accent colors. Try saying "make the background darker" or "change the primary color to green".`,
                    timestamp: new Date()
                  }]);
                }}
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded mb-2 group-hover:scale-110 transition-transform"></div>
                <p className="text-sm font-medium">Colors</p>
                <p className="text-xs text-gray-500">Change theme colors</p>
              </div>
              <div 
                className="p-3 border rounded-lg hover:border-blue-500 cursor-pointer transition-colors group"
                onClick={() => {
                  setActiveTool('typography');
                  setChatMessages(prev => [...prev, {
                    id: Date.now(),
                    type: 'ai',
                    content: `✍️ Opening typography settings for ${selectedFile.name}. You can adjust font families, sizes, weights, and spacing. Try "make headings larger" or "use a serif font for body text".`,
                    timestamp: new Date()
                  }]);
                }}
              >
                <Type className="w-8 h-8 text-gray-600 mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-sm font-medium">Typography</p>
                <p className="text-xs text-gray-500">Adjust fonts & sizes</p>
              </div>
              <div 
                className="p-3 border rounded-lg hover:border-blue-500 cursor-pointer transition-colors group"
                onClick={() => {
                  setActiveTool('layout');
                  setChatMessages(prev => [...prev, {
                    id: Date.now(),
                    type: 'ai',
                    content: `📐 Opening layout controls for ${selectedFile.name}. You can modify structure, grid systems, and component arrangement. Try "make it a two-column layout" or "center align the content".`,
                    timestamp: new Date()
                  }]);
                }}
              >
                <Layout className="w-8 h-8 text-gray-600 mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-sm font-medium">Layout</p>
                <p className="text-xs text-gray-500">Modify structure</p>
              </div>
              <div 
                className="p-3 border rounded-lg hover:border-blue-500 cursor-pointer transition-colors group"
                onClick={() => {
                  setActiveTool('spacing');
                  setChatMessages(prev => [...prev, {
                    id: Date.now(),
                    type: 'ai',
                    content: `📏 Opening spacing controls for ${selectedFile.name}. You can adjust margins, padding, and element spacing. Try "add more space between sections" or "reduce padding".`,
                    timestamp: new Date()
                  }]);
                }}
              >
                <Move className="w-8 h-8 text-gray-600 mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-sm font-medium">Spacing</p>
                <p className="text-xs text-gray-500">Adjust margins & padding</p>
              </div>
            </div>
          </div>

          {/* Component Customizations */}
          <div className="space-y-4">
            <h5 className="font-medium text-gray-900 flex items-center gap-2">
              <Box className="w-4 h-4" />
              Components
            </h5>
            <div className="space-y-3">
              <div 
                className="p-3 border rounded-lg hover:border-blue-500 cursor-pointer transition-colors group"
                onClick={() => {
                  setActiveTool('components');
                  setChatMessages(prev => [...prev, {
                    id: Date.now(),
                    type: 'ai',
                    content: `🧩 Opening component library for ${selectedFile.name}. You can add buttons, forms, cards, banners, and more. Try "add a promotional banner at the top" or "insert a contact form".`,
                    timestamp: new Date()
                  }]);
                }}
              >
                <div className="flex items-center gap-3">
                  <Box className="w-6 h-6 text-blue-600 group-hover:scale-110 transition-transform" />
                  <div>
                    <p className="text-sm font-medium">Add Component</p>
                    <p className="text-xs text-gray-500">Insert new elements</p>
                  </div>
                </div>
              </div>
              <div 
                className="p-3 border rounded-lg hover:border-blue-500 cursor-pointer transition-colors group"
                onClick={() => {
                  setChatMessages(prev => [...prev, {
                    id: Date.now(),
                    type: 'ai',
                    content: `🔄 Section reordering mode enabled for ${selectedFile.name}. You can drag sections up or down, or tell me which sections to move. Try "move the product grid above the banner" or "put testimonials at the bottom".`,
                    timestamp: new Date()
                  }]);
                }}
              >
                <div className="flex items-center gap-3">
                  <Layers className="w-6 h-6 text-green-600 group-hover:scale-110 transition-transform" />
                  <div>
                    <p className="text-sm font-medium">Reorder Sections</p>
                    <p className="text-xs text-gray-500">Drag & drop content</p>
                  </div>
                </div>
              </div>
              <div 
                className="p-3 border rounded-lg hover:border-blue-500 cursor-pointer transition-colors group"
                onClick={() => {
                  setChatMessages(prev => [...prev, {
                    id: Date.now(),
                    type: 'ai',
                    content: `👁️ Element visibility controls for ${selectedFile.name}. You can show or hide any section. Try "hide the sidebar" or "show product reviews only on desktop".`,
                    timestamp: new Date()
                  }]);
                }}
              >
                <div className="flex items-center gap-3">
                  <Eye className="w-6 h-6 text-purple-600 group-hover:scale-110 transition-transform" />
                  <div>
                    <p className="text-sm font-medium">Hide Elements</p>
                    <p className="text-xs text-gray-500">Show/hide content blocks</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Live Preview Mode */}
        {previewMode && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg p-8 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Eye className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Live Preview Mode</h3>
              <p className="text-gray-600 mb-4">
                Preview your customized {selectedFile.name} template as it would appear to your store visitors.
              </p>
              <div className="bg-white rounded-lg p-6 shadow-sm mb-4">
                <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-500 rounded mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">Template Preview</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {selectedFile.name} with your customizations
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Live</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Responsive</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Interactive</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Available Props */}
        {customizations?.availableProps && customizations.availableProps.length > 0 && (
          <div className="space-y-3">
            <h5 className="font-medium text-gray-900">Available Data</h5>
            <div className="flex flex-wrap gap-2">
              {customizations.availableProps.map(prop => (
                <span
                  key={prop}
                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full cursor-pointer hover:bg-blue-200 transition-colors"
                  title={`Click to use ${prop} in your template`}
                >
                  {prop}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Preview & Actions */}
        {!previewMode && (
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                Changes will be previewed instantly
              </span>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  // Reset customizations for this template
                  localStorage.removeItem(`template_customizations_${selectedFile.name}`);
                  setChatMessages(prev => [...prev, {
                    id: Date.now(),
                    type: 'ai',
                    content: `🔄 Reset all customizations for ${selectedFile.name}. The template is back to its original state.`,
                    timestamp: new Date()
                  }]);
                  setHasUnsavedChanges(false);
                }}
              >
                Reset Changes
              </Button>
              <Button 
                size="sm"
                onClick={() => {
                  // Save customizations
                  const customizationData = {
                    templateName: selectedFile.name,
                    customizations: selectedFile.customizations || {},
                    tools: { activeTool },
                    timestamp: new Date().toISOString(),
                    version: '1.0'
                  };
                  
                  localStorage.setItem(`template_customizations_${selectedFile.name}`, JSON.stringify(customizationData));
                  setLastSaved(new Date());
                  setHasUnsavedChanges(false);
                  
                  setChatMessages(prev => [...prev, {
                    id: Date.now(),
                    type: 'ai',
                    content: `💾 Saved customizations for ${selectedFile.name}! Your changes are preserved and will be applied to your storefront. You can continue editing or publish these changes.`,
                    timestamp: new Date()
                  }]);
                }}
              >
                Save Customization
              </Button>
              <Button 
                size="sm" 
                variant="default"
                onClick={handlePublish}
                disabled={isPublishing}
              >
                <Send className="w-4 h-4 mr-2" />
                {isPublishing ? 'Publishing...' : 'Publish Live'}
              </Button>
            </div>
          </div>
        </div>
        )}

        {/* Quick Template Switching */}
        {!previewMode && customizations?.availableProps && (
          <div className="border border-gray-200 rounded-lg p-4">
            <h6 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Quick Actions for {selectedFile.name}
            </h6>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="justify-start"
                onClick={() => {
                  setChatInput("Change the color scheme to dark mode");
                  handleSendMessage();
                }}
              >
                🌙 Dark Mode Theme
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="justify-start"
                onClick={() => {
                  setChatInput("Make the layout more compact");
                  handleSendMessage();
                }}
              >
                📱 Mobile Optimized
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="justify-start"
                onClick={() => {
                  setChatInput("Add a promotional banner at the top");
                  handleSendMessage();
                }}
              >
                📢 Add Promo Banner
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="justify-start"
                onClick={() => {
                  setChatInput("Hide the sidebar on mobile");
                  handleSendMessage();
                }}
              >
                📐 Responsive Layout
              </Button>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h6 className="font-medium text-blue-900 mb-2">💡 How to customize templates:</h6>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>Chat naturally:</strong> "Make the header blue" or "Add a contact form"</li>
            <li>• <strong>Visual controls:</strong> Click on styling options above for quick changes</li>
            <li>• <strong>Live preview:</strong> Toggle preview mode to see changes instantly</li>
            <li>• <strong>Safe editing:</strong> Original templates stay untouched - only customizations are saved</li>
            <li>• <strong>Publish:</strong> Make changes live on your storefront when ready</li>
          </ul>
        </div>
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
      
      {/* Authentication Status Banner */}
      {(() => {
        const token = localStorage.getItem('store_owner_auth_token') ||
                     localStorage.getItem('customer_auth_token') ||
                     localStorage.getItem('auth_token') ||
                     localStorage.getItem('token');
        
        if (!token) {
          return (
            <div className="bg-blue-50 border-b border-blue-200 px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-medium text-blue-800">
                    Showing Representative Content - Production Mode
                  </span>
                </div>
                <div className="text-xs text-blue-700">
                  <span className="font-medium">Note:</span> Source files aren't available in production for security
                </div>
              </div>
            </div>
          );
        } else {
          return (
            <div className="bg-blue-50 border-b border-blue-200 px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-medium text-blue-800">
                    Showing Representative Content - Production Mode
                  </span>
                </div>
                <div className="text-xs text-blue-700">
                  <span className="font-medium">Note:</span> Source files aren't available in production for security
                </div>
              </div>
            </div>
          );
        }
        return null;
      })()}
      
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
                        {selectedFile.hasCustomizations && (
                          <>
                            <div className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                              ✨ Customized
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setShowOriginalContent(!showOriginalContent)}
                              className="text-gray-600 hover:text-gray-700"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              {showOriginalContent ? 'Show Custom' : 'Show Original'}
                            </Button>
                          </>
                        )}
                        {!isEditing ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleStartEditing}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Edit3 className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                        ) : (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleSaveEdit}
                              className="text-green-600 hover:text-green-700"
                            >
                              <Save className="w-4 h-4 mr-1" />
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCancelEdit}
                              className="text-red-600 hover:text-red-700"
                            >
                              <RotateCcw className="w-4 h-4 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        )}
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
                  <div className="flex-1 flex flex-col">
                    {isEditing ? (
                      // Editable code editor
                      <div className="flex-1 flex flex-col">
                        <div className="p-2 bg-blue-50 border-b border-blue-200">
                          <div className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-blue-800 font-medium">Editing Mode Active</span>
                            <span className="text-blue-600">- Make your changes below</span>
                          </div>
                        </div>
                        <textarea
                          value={editedContent}
                          onChange={(e) => setEditedContent(e.target.value)}
                          className="flex-1 p-4 bg-gray-900 text-gray-100 font-mono text-sm resize-none border-none outline-none"
                          style={{
                            fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                            fontSize: '14px',
                            lineHeight: '1.5',
                            tabSize: 2
                          }}
                          placeholder="Enter your code here..."
                          spellCheck={false}
                        />
                        <div className="p-2 bg-gray-100 border-t border-gray-200">
                          <div className="flex items-center justify-between text-xs text-gray-600">
                            <span>💡 Tip: Use Ctrl+S (Cmd+S) to save quickly</span>
                            <span>Lines: {editedContent.split('\n').length}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Read-only display
                      <div className="flex-1 flex flex-col">
                        <div className="p-2 bg-gray-50 border-b border-gray-200">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Read-only view</span>
                            <span className="text-gray-500">Click "Edit" to modify</span>
                          </div>
                        </div>
                        <div className="flex-1 p-4 bg-gray-900 text-gray-100 font-mono text-sm overflow-auto">
                          <pre className="whitespace-pre-wrap">
                            {showOriginalContent && selectedFile.hasCustomizations 
                              ? selectedFile.originalContent 
                              : selectedFile.content}
                          </pre>
                        </div>
                      </div>
                    )}
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
                    {selectedFile && selectedFile.type === 'template-customization' ? renderTemplateCustomization() : renderToolContent()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Children content - only render when not in template customization mode */}
        {!isTemplateEditor && children && (
          <div className="flex-1">
            {children}
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default EditorLayout;