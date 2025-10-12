import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Send,
  Mic,
  Image as ImageIcon,
  Code,
  Loader2,
  CheckCircle,
  AlertCircle,
  Wand2,
  Layout,
  ShoppingBag,
  Palette,
  Globe,
  Zap,
  Eye,
  FileCode,
  Settings,
  RefreshCw,
  Download,
  Upload,
  Copy,
  Maximize2
} from 'lucide-react';

/**
 * Catalyst AI Studio - Enterprise-grade AI Shop Builder
 * Competitive with Lovable, Bolt, V0 but specialized for e-commerce
 */
export default function CatalystAIStudio({ initialContext = 'general' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [panelSize, setPanelSize] = useState('normal'); // 'normal' | 'wide' | 'fullscreen'
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'code' | 'preview'
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [context, setContext] = useState(initialContext);
  const [generatedCode, setGeneratedCode] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const scrollRef = useRef(null);

  // AI Capabilities by context
  const capabilities = {
    general: [
      'Build complete store layouts',
      'Generate product pages',
      'Create custom components',
      'Translate content',
      'Optimize SEO'
    ],
    storefront: [
      'Design homepage layouts',
      'Create product carousels',
      'Build checkout flows',
      'Customize navigation',
      'Add promotional banners'
    ],
    products: [
      'Generate product descriptions',
      'Create product variants',
      'Bulk import products',
      'Optimize product SEO',
      'AI product photography'
    ],
    design: [
      'Design color schemes',
      'Create responsive layouts',
      'Build custom components',
      'Generate CSS styles',
      'Theme customization'
    ],
    plugins: [
      'Create payment plugins',
      'Build shipping integrations',
      'Generate API connectors',
      'Custom functionality',
      'Third-party integrations'
    ],
    translations: [
      'Auto-translate store',
      'Localize content',
      'Manage languages',
      'RTL support',
      'Cultural adaptation'
    ]
  };

  // Example prompts to inspire users
  const examplePrompts = {
    general: [
      "Create a modern fashion store with product grid and filters",
      "Build a subscription-based product page with recurring billing",
      "Design a multi-vendor marketplace homepage"
    ],
    storefront: [
      "Add a hero section with video background and CTA button",
      "Create a featured products carousel with smooth transitions",
      "Build a mega menu with categories and featured items"
    ],
    products: [
      "Generate SEO-optimized descriptions for all products",
      "Create product bundles with discount logic",
      "Add AI-powered product recommendations"
    ],
    design: [
      "Design a luxury brand color scheme with gold accents",
      "Create a minimalist product page layout",
      "Build a dark mode theme"
    ],
    plugins: [
      "Create a Stripe payment plugin with recurring billing",
      "Build a shipment tracking integration",
      "Generate a custom loyalty points system"
    ],
    translations: [
      "Translate my entire store to Spanish, French, and German",
      "Localize product names for Chinese market",
      "Add RTL support for Arabic"
    ]
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (messages.length === 0) {
      addWelcomeMessage();
    }
  }, [context]);

  const addWelcomeMessage = () => {
    const contextName = context.charAt(0).toUpperCase() + context.slice(1);
    addMessage('ai',
      `👋 Hi! I'm Catalyst AI, your e-commerce shop builder.\n\n` +
      `I'm currently in ${contextName} mode. I can help you:\n\n` +
      capabilities[context]?.map((cap, i) => `${i + 1}. ${cap}`).join('\n') +
      `\n\nWhat would you like to build today?`
    );
  };

  const addMessage = (sender, content, metadata = {}) => {
    setMessages(prev => [...prev, {
      id: Date.now() + Math.random(),
      sender,
      content,
      timestamp: new Date(),
      metadata
    }]);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isProcessing) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    addMessage('user', userMessage);
    setIsProcessing(true);

    try {
      const response = await fetch('/api/ai/studio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          message: userMessage,
          context,
          history: messages.slice(-10),
          capabilities: capabilities[context]
        })
      });

      const data = await response.json();

      if (data.success) {
        addMessage('ai', data.response, data.metadata);

        // Handle code generation
        if (data.code) {
          setGeneratedCode(data.code);
          setActiveTab('code');
        }

        // Handle preview
        if (data.previewUrl) {
          setPreviewUrl(data.previewUrl);
          setActiveTab('preview');
        }

        // Handle actions
        if (data.actions) {
          data.actions.forEach(action => handleAIAction(action));
        }
      } else {
        addMessage('ai', 'I encountered an error. Please try again.', { error: true });
      }
    } catch (error) {
      console.error('AI Studio error:', error);
      addMessage('ai', 'Sorry, something went wrong. Please try again.', { error: true });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAIAction = (action) => {
    switch (action.type) {
      case 'create_component':
        // Create component in database
        break;
      case 'update_layout':
        // Update store layout
        break;
      case 'generate_plugin':
        // Generate plugin code
        break;
      case 'translate_content':
        // Trigger translation
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  const handleExamplePrompt = (prompt) => {
    setInputValue(prompt);
  };

  const togglePanelSize = () => {
    if (panelSize === 'normal') setPanelSize('wide');
    else if (panelSize === 'wide') setPanelSize('fullscreen');
    else setPanelSize('normal');
  };

  const getPanelWidth = () => {
    switch (panelSize) {
      case 'wide': return '600px';
      case 'fullscreen': return '100%';
      default: return '450px';
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <Button
        className="fixed left-4 top-20 z-40 shadow-2xl bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 text-white border-0 hover:from-purple-700 hover:via-blue-700 hover:to-cyan-700 transition-all duration-300 hover:scale-105"
        onClick={() => setIsOpen(!isOpen)}
        size="lg"
      >
        <Wand2 className="h-5 w-5 mr-2 animate-pulse" />
        <span className="font-semibold">Catalyst AI</span>
        {isProcessing && (
          <Badge variant="secondary" className="ml-2 animate-bounce">
            <Loader2 className="h-3 w-3 animate-spin" />
          </Badge>
        )}
      </Button>

      {/* Main AI Studio Panel */}
      <div
        className={`fixed left-0 top-0 h-full bg-white shadow-2xl z-50 transition-all duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ width: getPanelWidth() }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 text-white">
          <div className="flex items-center gap-3">
            <Wand2 className="h-6 w-6" />
            <div>
              <h2 className="font-bold text-lg">Catalyst AI Studio</h2>
              <p className="text-xs opacity-90">E-commerce Intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={togglePanelSize}
              className="text-white hover:bg-white/20"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Context Selector */}
        <div className="p-3 border-b bg-gray-50">
          <label className="text-xs font-medium text-gray-600 mb-1 block">AI Mode</label>
          <Select value={context} onValueChange={(val) => { setContext(val); setMessages([]); }}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">
                <Sparkles className="inline h-4 w-4 mr-2" />
                General Builder
              </SelectItem>
              <SelectItem value="storefront">
                <Layout className="inline h-4 w-4 mr-2" />
                Storefront Design
              </SelectItem>
              <SelectItem value="products">
                <ShoppingBag className="inline h-4 w-4 mr-2" />
                Product Management
              </SelectItem>
              <SelectItem value="design">
                <Palette className="inline h-4 w-4 mr-2" />
                Theme & Design
              </SelectItem>
              <SelectItem value="plugins">
                <Zap className="inline h-4 w-4 mr-2" />
                Plugins & Integration
              </SelectItem>
              <SelectItem value="translations">
                <Globe className="inline h-4 w-4 mr-2" />
                Translations & Localization
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-[calc(100vh-200px)]">
          <TabsList className="w-full grid grid-cols-3 bg-gray-100">
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="code" className="flex items-center gap-2">
              <FileCode className="h-4 w-4" />
              Code
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </TabsTrigger>
          </TabsList>

          {/* Chat Tab */}
          <TabsContent value="chat" className="flex-1 flex flex-col mt-0">
            {/* Example Prompts */}
            {messages.length <= 1 && (
              <div className="p-3 border-b bg-gradient-to-r from-purple-50 to-blue-50">
                <p className="text-xs font-semibold text-gray-700 mb-2">Try asking:</p>
                <div className="space-y-1">
                  {examplePrompts[context]?.slice(0, 3).map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => handleExamplePrompt(prompt)}
                      className="w-full text-left text-xs p-2 rounded bg-white hover:bg-purple-50 border border-gray-200 hover:border-purple-300 transition-colors"
                    >
                      💡 {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <Card
                      className={`max-w-[85%] p-3 ${
                        message.sender === 'user'
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                          : message.metadata?.error
                          ? 'bg-red-50 border-red-200'
                          : message.metadata?.success
                          ? 'bg-green-50 border-green-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      {message.metadata?.success && (
                        <CheckCircle className="h-4 w-4 text-green-600 mb-2" />
                      )}
                      {message.metadata?.error && (
                        <AlertCircle className="h-4 w-4 text-red-600 mb-2" />
                      )}
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">
                        {message.content}
                      </p>
                      {message.metadata?.actions && (
                        <div className="mt-3 space-y-2">
                          {message.metadata.actions.map((action, i) => (
                            <Button key={i} size="sm" variant="outline" className="w-full">
                              {action.label}
                            </Button>
                          ))}
                        </div>
                      )}
                      <p className="text-xs opacity-60 mt-2">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </Card>
                  </div>
                ))}
                {isProcessing && messages[messages.length - 1]?.sender === 'user' && (
                  <div className="flex justify-start">
                    <Card className="bg-gray-50 p-3 border-gray-200">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                        <span className="text-sm text-gray-600">AI is thinking...</span>
                      </div>
                    </Card>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Code Tab */}
          <TabsContent value="code" className="flex-1 mt-0 p-0">
            <div className="h-full bg-gray-900 text-green-400 font-mono text-xs p-4 overflow-auto">
              {generatedCode || '// No code generated yet. Start chatting with AI!'}
            </div>
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview" className="flex-1 mt-0 p-0">
            {previewUrl ? (
              <iframe
                src={previewUrl}
                className="w-full h-full border-0"
                title="AI Preview"
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-gray-50">
                <p className="text-gray-500">No preview available yet</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Input Area */}
        <div className="p-4 border-t bg-white">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Describe what you want to build... (Shift+Enter for new line)"
                rows={3}
                className="resize-none text-sm"
                disabled={isProcessing}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Button size="icon" variant="outline" disabled={isProcessing}>
                <Mic className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="outline" disabled={isProcessing}>
                <ImageIcon className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isProcessing}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Powered by Claude AI • Press Enter to send
          </p>
        </div>
      </div>

      {/* Overlay */}
      {isOpen && panelSize !== 'fullscreen' && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-40 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
