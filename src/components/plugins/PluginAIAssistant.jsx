/**
 * AI Assistant for Plugin Development
 * Shared component for both No-Code and Developer modes
 */

import React, { useState, useRef, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Bot,
  Send,
  Loader2,
  Sparkles,
  Code,
  FileText,
  Zap,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react';
import apiClient from '@/api/client';

const PluginAIAssistant = ({ mode = 'nocode', onCodeGenerated, onConfigGenerated, currentContext }) => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: mode === 'nocode'
        ? '👋 Hi! I\'ll help you build a plugin without writing any code. Just describe what you want to create!'
        : '👋 Hi! I\'m your AI coding assistant. I can help you write code, debug, and improve your plugin.',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Generate contextual suggestions based on mode
    if (mode === 'nocode') {
      setSuggestions([
        'Create a customer loyalty points plugin',
        'Build a product recommendation widget',
        'Add a custom checkout field',
        'Create a shipping calculator'
      ]);
    } else {
      setSuggestions([
        'Help me debug this hook function',
        'Optimize this database query',
        'Add error handling to this code',
        'Generate tests for this component'
      ]);
    }
  }, [mode]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      // Send to Claude API for plugin generation
      const response = await apiClient.post('plugins/ai/generate', {
        mode,
        prompt: input,
        context: currentContext
      });

      // Handle response based on mode
      let aiMessageContent = '';
      let generatedCode = null;
      let generatedFiles = null;
      let generatedConfig = null;

      if (mode === 'nocode-ai') {
        aiMessageContent = response.explanation || '✅ Plugin generated successfully!';
        generatedCode = response.generatedCode || response.code;
        generatedFiles = response.generatedFiles || response.files;
      } else if (mode === 'guided') {
        aiMessageContent = response.suggestions?.join('\n') || 'Configuration updated!';
        generatedConfig = response.config;
        generatedFiles = response.generatedFiles;
      } else if (mode === 'developer') {
        aiMessageContent = response.explanation || 'Code generated!';
        generatedCode = response.code;
        generatedFiles = response.generatedFiles;
      }

      const aiMessage = {
        role: 'assistant',
        content: aiMessageContent,
        generatedCode,
        generatedConfig,
        files: generatedFiles,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);

      // Notify parent components of generated code/config
      if (generatedCode && onCodeGenerated) {
        onCodeGenerated(generatedCode, generatedFiles);
      }
      if (generatedConfig && onConfigGenerated) {
        onConfigGenerated(generatedConfig);
      }

    } catch (error) {
      console.error('AI Assistant error:', error);

      // Extract detailed error message
      let errorMessage = '❌ Sorry, I encountered an error.';
      if (error.response?.data?.error) {
        errorMessage = `❌ Error: ${error.response.data.error}`;
      } else if (error.message) {
        errorMessage = `❌ Error: ${error.message}`;
      }

      // Add helpful hints based on error
      if (error.message?.includes('ANTHROPIC_API_KEY')) {
        errorMessage += '\n\n💡 The Claude API key is not configured. Please add ANTHROPIC_API_KEY to your environment variables.';
      } else if (error.response?.status === 500) {
        errorMessage += '\n\n💡 Server error. Please check the backend logs for details.';
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: errorMessage,
        error: true,
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion);
  };

  const handleApplyCode = (message) => {
    if (message.generatedCode && onCodeGenerated) {
      onCodeGenerated(message.generatedCode, message.files);
    }
    if (message.generatedConfig && onConfigGenerated) {
      onConfigGenerated(message.generatedConfig);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="p-4 border-b bg-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">AI Plugin Assistant</h3>
            <p className="text-xs text-gray-600">
              {mode === 'nocode' ? 'No-code plugin builder' : 'Code generation & debugging'}
            </p>
          </div>
          <Badge className="bg-green-100 text-green-700">
            <Sparkles className="w-3 h-3 mr-1" />
            Active
          </Badge>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : message.error
                  ? 'bg-red-50 text-red-900'
                  : 'bg-white shadow-sm border'
              }`}
            >
              <div className="flex items-start gap-2">
                {message.role === 'assistant' && (
                  <Bot className="w-4 h-4 mt-1 text-blue-600 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>

                  {/* Code preview */}
                  {message.generatedCode && (
                    <div className="mt-3 space-y-2">
                      <div className="bg-gray-900 rounded-lg p-3 text-xs font-mono text-gray-100 overflow-x-auto">
                        <pre>{message.generatedCode.substring(0, 200)}...</pre>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleApplyCode(message)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Apply Code
                      </Button>
                    </div>
                  )}

                  {/* Files generated */}
                  {message.files && message.files.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs font-medium text-gray-700">Generated files:</p>
                      {message.files.map((file, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                          <FileText className="w-3 h-3" />
                          <span>{file.name}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <p className="text-xs text-gray-500 mt-2">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white shadow-sm border rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                <span className="text-sm text-gray-600">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && messages.length === 1 && (
        <div className="px-4 pb-2">
          <p className="text-xs text-gray-600 mb-2">Quick starts:</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="px-3 py-1 text-xs bg-white border rounded-full hover:bg-gray-50 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t bg-white/80 backdrop-blur-sm">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
            placeholder={
              mode === 'nocode'
                ? 'Describe the plugin you want to build...'
                : 'Ask me to write code, debug, or optimize...'
            }
            className="flex-1"
            disabled={isTyping}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!input.trim() || isTyping}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isTyping ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PluginAIAssistant;
