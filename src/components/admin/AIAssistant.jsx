import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Sparkles,
  ChevronLeft,
  Send,
  Paperclip,
  Loader2,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react';

/**
 * Global AI Assistant Component
 * Left-sliding panel for AI operations across admin
 */
export default function AIAssistant({ context, quickActions = [], onClose }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Add welcome message on mount
  useEffect(() => {
    if (messages.length === 0) {
      addMessage('ai', `Hi! I'm your AI assistant. I can help you with ${getContextDescription(context)}.`);
    }
  }, [context]);

  const getContextDescription = (ctx) => {
    const descriptions = {
      translations: 'translations, AI translation, and managing multiple languages',
      products: 'product management, content generation, and bulk operations',
      editor: 'layout editing, component modifications, and design changes',
      plugins: 'plugin creation, code generation, and integrations',
      default: 'various tasks across your admin panel'
    };
    return descriptions[ctx] || descriptions.default;
  };

  const addMessage = (sender, content, metadata = {}) => {
    setMessages(prev => [...prev, {
      id: Date.now(),
      sender, // 'user' or 'ai'
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
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          message: userMessage,
          context,
          history: messages.slice(-5) // Send last 5 messages for context
        })
      });

      const data = await response.json();

      if (data.success) {
        addMessage('ai', data.response, data.metadata);

        // Handle special actions
        if (data.action) {
          handleAIAction(data.action, data.actionData);
        }
      } else {
        addMessage('ai', 'Sorry, I encountered an error. Please try again.', { error: true });
      }
    } catch (error) {
      console.error('AI chat error:', error);
      addMessage('ai', 'Sorry, I couldn\'t process your request. Please try again.', { error: true });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQuickAction = async (action) => {
    setIsProcessing(true);
    setCurrentTask({
      label: action.label,
      progress: 0
    });

    try {
      addMessage('user', action.label);

      const result = await action.handler();

      if (result.success) {
        addMessage('ai', result.message || 'Task completed successfully!', {
          success: true,
          data: result.data
        });
      } else {
        addMessage('ai', result.message || 'Task failed. Please try again.', { error: true });
      }
    } catch (error) {
      console.error('Quick action error:', error);
      addMessage('ai', 'An error occurred while processing your request.', { error: true });
    } finally {
      setIsProcessing(false);
      setCurrentTask(null);
    }
  };

  const handleAIAction = (action, data) => {
    // Handle special AI-initiated actions
    switch (action) {
      case 'navigate':
        window.location.href = data.url;
        break;
      case 'refresh':
        window.location.reload();
        break;
      case 'show_results':
        // Open a modal or navigate to results page
        break;
      default:
        console.log('Unknown action:', action);
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
      {/* Toggle Button */}
      <Button
        variant="outline"
        size="sm"
        className="fixed left-4 top-20 z-40 shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 hover:from-blue-700 hover:to-purple-700"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Sparkles className="h-4 w-4 mr-2" />
        AI Assistant
        {isProcessing && (
          <Badge variant="secondary" className="ml-2">
            <Loader2 className="h-3 w-3 animate-spin" />
          </Badge>
        )}
      </Button>

      {/* Sliding Panel */}
      <div
        className={`fixed left-0 top-0 h-full bg-white shadow-2xl z-50 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ width: '400px' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            <div>
              <h2 className="font-semibold text-gray-900">AI Copilot</h2>
              <p className="text-xs text-gray-500">Context: {context || 'General'}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        {/* Quick Actions */}
        {quickActions.length > 0 && (
          <div className="p-4 border-b bg-gray-50">
            <p className="text-xs font-medium text-gray-700 mb-2">Quick Actions</p>
            <div className="space-y-2">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-left"
                  onClick={() => handleQuickAction(action)}
                  disabled={isProcessing}
                >
                  {action.icon && <span className="mr-2">{action.icon}</span>}
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Current Task Progress */}
        {currentTask && (
          <div className="p-4 border-b bg-blue-50">
            <div className="flex items-center gap-2 mb-2">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              <span className="text-sm font-medium text-gray-900">{currentTask.label}</span>
            </div>
            {currentTask.progress > 0 && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${currentTask.progress}%` }}
                />
              </div>
            )}
          </div>
        )}

        {/* Chat Messages */}
        <ScrollArea className="flex-1 p-4" style={{ height: 'calc(100vh - 280px)' }} ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <Card
                  className={`max-w-[85%] p-3 ${
                    message.sender === 'user'
                      ? 'bg-blue-600 text-white'
                      : message.metadata?.error
                      ? 'bg-red-50 border-red-200'
                      : message.metadata?.success
                      ? 'bg-green-50 border-green-200'
                      : 'bg-gray-50'
                  }`}
                >
                  {message.metadata?.success && (
                    <CheckCircle className="h-4 w-4 text-green-600 mb-2" />
                  )}
                  {message.metadata?.error && (
                    <AlertCircle className="h-4 w-4 text-red-600 mb-2" />
                  )}
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs opacity-60 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </Card>
              </div>
            ))}
            {isProcessing && messages[messages.length - 1]?.sender === 'user' && (
              <div className="flex justify-start">
                <Card className="bg-gray-50 p-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    <span className="text-sm text-gray-600">Thinking...</span>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 border-t bg-white">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your request... (Enter to send, Shift+Enter for new line)"
                rows={2}
                className="resize-none"
                disabled={isProcessing}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Button
                size="icon"
                variant="outline"
                disabled={isProcessing}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isProcessing}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-20 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
