import React, { useState, useEffect, useRef } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Send, 
  Bot, 
  User, 
  Code, 
  FileText, 
  Settings, 
  Play,
  Square,
  RefreshCw,
  Download,
  Upload,
  Zap,
  Cpu,
  Database,
  Globe
} from 'lucide-react';

import StorefrontPreview from './StorefrontPreview';
import CodeEditor from './CodeEditor';
import FileTreeNavigator from './FileTreeNavigator';
import BrowserPreview from './BrowserPreview';
import DiffPreviewSystem from './DiffPreviewSystem';

const AIContextWindow = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [patches, setPatches] = useState([]);
  const [previewMode, setPreviewMode] = useState('visual');
  const [context, setContext] = useState({
    codebase: {},
    currentTask: '',
    modifications: []
  });

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize with welcome message
  useEffect(() => {
    setMessages([
      {
        id: 1,
        type: 'assistant',
        content: 'Hello! I\'m your AI development assistant. I can help you modify your storefront code, create components, and make improvements. What would you like to work on today?',
        timestamp: new Date()
      }
    ]);
  }, []);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsGenerating(true);

    try {
      // Simulate AI processing delay
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

      // Generate response based on message content
      const response = await generateAIResponse(inputMessage, context);
      
      const assistantMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: response.content,
        patches: response.patches,
        suggestions: response.suggestions,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Update patches if provided
      if (response.patches) {
        setPatches(prev => [...prev, ...response.patches]);
      }
      
      // Update context
      setContext(prev => ({
        ...prev,
        currentTask: inputMessage,
        modifications: [...prev.modifications, response]
      }));

    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: `I apologize, but I encountered an error: ${error.message}. Please try again.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }

    setIsGenerating(false);
  };

  const generateAIResponse = async (message, context) => {
    // Simulate AI response generation
    const responses = {
      // UI/Component related
      'button': {
        content: 'I can help you create or modify buttons. Here are some patches to improve your button components with better styling and accessibility.',
        patches: [
          {
            name: 'Enhanced Button Styling',
            type: 'json-patch',
            description: 'Add hover effects and improved accessibility',
            operations: [
              { op: 'replace', path: '/className', value: 'px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2' }
            ]
          }
        ]
      },

      // E-commerce related
      'cart': {
        content: 'I can help optimize your shopping cart functionality. Here are some improvements for better user experience.',
        patches: [
          {
            name: 'Cart State Management',
            type: 'unified-diff',
            description: 'Improve cart state handling and persistence',
            diff: `@@ -1,5 +1,8 @@
 const [cartItems, setCartItems] = useState([]);
+const [cartTotal, setCartTotal] = useState(0);
+
+useEffect(() => {
+  setCartTotal(cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0));
+}, [cartItems]);`
          }
        ]
      },

      // Performance related
      'performance': {
        content: 'I can help optimize your storefront performance. Here are some patches to implement lazy loading and memoization.',
        patches: [
          {
            name: 'React.memo Optimization',
            type: 'json-patch',
            description: 'Add memoization to prevent unnecessary re-renders',
            operations: [
              { op: 'replace', path: '/export', value: 'React.memo(Component)' }
            ]
          }
        ]
      },

      // Default response
      'default': {
        content: 'I understand you want to work on your storefront. Could you be more specific about what you\'d like to modify? For example:\n\n• Update a specific component\n• Improve performance\n• Add new features\n• Fix styling issues\n• Optimize for mobile\n\nI can generate code patches and show you a preview of the changes.',
        patches: []
      }
    };

    // Simple keyword matching for demo
    const lowerMessage = message.toLowerCase();
    let selectedResponse = responses.default;

    for (const [key, response] of Object.entries(responses)) {
      if (lowerMessage.includes(key)) {
        selectedResponse = response;
        break;
      }
    }

    return selectedResponse;
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileSelect = (file) => {
    setSelectedFile(file);
    // In a real implementation, this would load the actual file content
    setFileContent(`// Content of ${file.name}\n// This is a placeholder for the actual file content`);
  };

  const handleCodeChange = (newCode) => {
    setFileContent(newCode);
  };

  const handlePatchToggle = (selectedPatchIndices) => {
    // Handle patch selection changes
    console.log('Selected patches:', selectedPatchIndices);
  };

  const applyPatches = () => {
    // Apply selected patches to the codebase
    alert('Patches would be applied in a real implementation');
  };

  const MessageItem = ({ message }) => {
    const isUser = message.type === 'user';
    
    return (
      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`flex ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start space-x-2 max-w-3xl`}>
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            isUser ? 'bg-blue-500 ml-2' : 'bg-green-500 mr-2'
          }`}>
            {isUser ? (
              <User className="w-4 h-4 text-white" />
            ) : (
              <Bot className="w-4 h-4 text-white" />
            )}
          </div>
          
          <div className={`rounded-lg p-3 ${
            isUser 
              ? 'bg-blue-500 text-white' 
              : 'bg-muted'
          }`}>
            <p className="whitespace-pre-wrap">{message.content}</p>
            
            {message.patches && message.patches.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-sm font-medium">Generated patches:</p>
                {message.patches.map((patch, index) => (
                  <Badge key={index} variant="secondary" className="mr-1">
                    {patch.name}
                  </Badge>
                ))}
              </div>
            )}
            
            <p className="text-xs opacity-70 mt-2">
              {message.timestamp.toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="w-6 h-6 text-blue-500" />
            <h1 className="text-xl font-semibold">AI Context Window</h1>
            <Badge variant="outline">v2.0</Badge>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="chat" className="flex items-center">
              <Bot className="w-4 h-4 mr-1" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="code" className="flex items-center">
              <Code className="w-4 h-4 mr-1" />
              Code
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center">
              <Globe className="w-4 h-4 mr-1" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="files" className="flex items-center">
              <FileText className="w-4 h-4 mr-1" />
              Files
            </TabsTrigger>
            <TabsTrigger value="diff" className="flex items-center">
              <Database className="w-4 h-4 mr-1" />
              Diff
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 flex">
            <TabsContent value="chat" className="flex-1 flex flex-col m-0">
              {/* Chat Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <MessageItem key={message.id} message={message} />
                  ))}
                  
                  {isGenerating && (
                    <div className="flex justify-start mb-4">
                      <div className="flex items-start space-x-2 max-w-3xl">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center mr-2">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                        <div className="bg-muted rounded-lg p-3">
                          <div className="flex items-center space-x-2">
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>AI is thinking...</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="border-t p-4">
                <div className="flex space-x-2">
                  <Textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Ask me to modify your storefront code..."
                    className="resize-none"
                    rows={2}
                  />
                  <Button 
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isGenerating}
                    size="lg"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="code" className="flex-1 m-0">
              <div className="h-full flex">
                <div className="w-1/4 border-r">
                  <FileTreeNavigator 
                    onFileSelect={handleFileSelect}
                    selectedFile={selectedFile}
                  />
                </div>
                <div className="flex-1">
                  <CodeEditor 
                    code={fileContent}
                    onChange={handleCodeChange}
                    language="javascript"
                    fileName={selectedFile?.name}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="flex-1 m-0">
              <div className="h-full flex flex-col">
                <div className="border-b p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Storefront Preview</h3>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" onClick={applyPatches}>
                        <Play className="w-4 h-4 mr-1" />
                        Apply Changes
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="grid grid-cols-2 h-full">
                    <div className="border-r">
                      <StorefrontPreview 
                        patches={patches}
                        originalCode={fileContent}
                        onPatchToggle={handlePatchToggle}
                        previewMode={previewMode}
                      />
                    </div>
                    <div>
                      <BrowserPreview />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="files" className="flex-1 m-0 p-4">
              <FileTreeNavigator 
                onFileSelect={handleFileSelect}
                selectedFile={selectedFile}
                showDetails={true}
              />
            </TabsContent>

            <TabsContent value="diff" className="flex-1 m-0">
              <DiffPreviewSystem 
                patches={patches}
                originalCode={fileContent}
                modifiedCode={fileContent} // Would be the patched code
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Status Bar */}
      <div className="border-t px-4 py-2 bg-muted/50">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center space-x-4">
            <span>Context: {context.currentTask || 'Ready'}</span>
            <Separator orientation="vertical" className="h-4" />
            <span>Patches: {patches.length}</span>
            <Separator orientation="vertical" className="h-4" />
            <span>File: {selectedFile?.name || 'None'}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Cpu className="w-4 h-4" />
            <span>AI Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIContextWindow;