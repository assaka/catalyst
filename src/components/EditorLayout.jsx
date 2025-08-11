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
  Tablet
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
  
  // Get user info for shared header
  const user = JSON.parse(localStorage.getItem('user') || '{}');

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
              {previewMode ? (
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
  );
};

export default EditorLayout;