/**
 * Enhanced No-Code Plugin Builder
 * Smart AI assistant that guides users with contextual questions
 * Perfect for non-technical users - combines conversational AI with intelligent prompts
 */

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Sparkles,
  Send,
  Zap,
  Code2,
  Lightbulb,
  MessageCircle,
  CheckCircle,
  ArrowRight,
  Loader2,
  Bot,
  User,
  ChevronDown
} from 'lucide-react';
import SaveButton from '@/components/ui/save-button';

const EnhancedNoCodeBuilder = ({ onSave, onCancel, onSwitchMode, initialContext }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [pluginConfig, setPluginConfig] = useState(initialContext || {});
  const [currentStep, setCurrentStep] = useState('start'); // start, building, reviewing, complete
  const [smartSuggestions, setSmartSuggestions] = useState([]);

  // Detect if editing existing plugin (has meaningful data like name)
  const isEditingExisting = !!(initialContext?.name || initialContext?.id);
  const [showTemplates, setShowTemplates] = useState(!isEditingExisting);

  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  const templates = [
    {
      id: 'reviews',
      icon: '⭐',
      title: 'Product Reviews',
      description: '5-star ratings and customer feedback',
      prompt: 'I want to add a product review system to my store'
    },
    {
      id: 'wishlist',
      icon: '❤️',
      title: 'Customer Wishlist',
      description: 'Save favorite products',
      prompt: 'I want customers to save their favorite products'
    },
    {
      id: 'loyalty',
      icon: '🎁',
      title: 'Loyalty Program',
      description: 'Points and rewards',
      prompt: 'I want to reward customers with points for purchases'
    },
    {
      id: 'referral',
      icon: '🤝',
      title: 'Referral System',
      description: 'Invite friends for rewards',
      prompt: 'I want customers to refer friends and earn rewards'
    },
    {
      id: 'custom',
      icon: '✨',
      title: 'Custom Plugin',
      description: 'Build from scratch',
      prompt: ''
    }
  ];

  // Generate context-aware questions based on what exists
  const generateEditingQuestions = () => {
    const questions = [];

    if (pluginConfig.hooks && pluginConfig.hooks.length > 0) {
      questions.push(`What do the ${pluginConfig.hooks.length} existing hooks do?`);
    }

    if (pluginConfig.eventListeners && pluginConfig.eventListeners.length > 0) {
      questions.push(`Explain the ${pluginConfig.eventListeners.length} event listeners`);
    }

    if (pluginConfig.components && pluginConfig.components.length > 0) {
      questions.push(`How can I modify the ${pluginConfig.components.length} UI components?`);
    }

    questions.push("Add a new feature to this plugin");
    questions.push("How can I improve the current functionality?");

    return questions.length > 2 ? questions.slice(0, 4) : [
      "Explain what this plugin does",
      "Add a new feature",
      "Show me the current implementation",
      "How can I enhance this plugin?"
    ];
  };

  const starterQuestions = isEditingExisting ? generateEditingQuestions() : [
    "What problem are you trying to solve?",
    "What features do you need?",
    "Who will use this plugin?",
    "Do you need to store data in a database?"
  ];

  useEffect(() => {
    if (messages.length === 0 && currentStep === 'start') {
      // Send context-aware welcome message
      if (isEditingExisting) {
        addBotMessage(
          `Hi! I can see you're working on "${pluginConfig.name}".\n\nI can help you enhance, modify, or add new features to this plugin. What would you like to do?`
        );
        generateSmartSuggestions('editing');
      } else {
        addBotMessage(
          "Hi! I'm your AI plugin builder assistant. I'll help you create a custom plugin by asking you a few questions.\n\nLet's get started - what kind of plugin would you like to build? You can choose a template below or describe your own idea."
        );
        generateSmartSuggestions('initial');
      }
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addBotMessage = (content, metadata = {}) => {
    setMessages(prev => [...prev, {
      role: 'assistant',
      content,
      timestamp: new Date(),
      ...metadata
    }]);
  };

  const addUserMessage = (content) => {
    setMessages(prev => [...prev, {
      role: 'user',
      content,
      timestamp: new Date()
    }]);
  };

  const generateSmartSuggestions = async (context, userMessage = '') => {
    try {
      const response = await fetch('/api/plugins/ai/smart-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context,
          currentStep,
          pluginConfig,
          recentMessages: messages.slice(-5),
          userMessage
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSmartSuggestions(data.suggestions || []);
      }
    } catch (err) {
      console.error('Error generating suggestions:', err);
    }
  };

  const handleTemplateSelect = async (template) => {
    setShowTemplates(false);
    const message = template.prompt || template.title;
    await handleSendMessage(message);
  };

  const handleSuggestionClick = async (suggestion) => {
    await handleSendMessage(suggestion);
  };

  const handleSendMessage = async (messageText = inputMessage) => {
    if (!messageText.trim()) return;

    const userMsg = messageText.trim();
    addUserMessage(userMsg);
    setInputMessage('');
    setIsTyping(true);
    setSmartSuggestions([]);

    try {
      const response = await fetch('/api/plugins/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          mode: 'nocode',
          conversationHistory: messages,
          pluginConfig,
          currentStep
        })
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let botResponse = '';
      let tempMessageId = Date.now();

      // Add placeholder for streaming
      setMessages(prev => [...prev, {
        id: tempMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        streaming: true
      }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);

              if (parsed.content) {
                botResponse += parsed.content;
                // Update streaming message
                setMessages(prev => prev.map(m =>
                  m.id === tempMessageId
                    ? { ...m, content: botResponse }
                    : m
                ));
              }

              if (parsed.config) {
                setPluginConfig(prev => ({ ...prev, ...parsed.config }));
              }

              if (parsed.step) {
                setCurrentStep(parsed.step);
              }

              if (parsed.suggestions) {
                setSmartSuggestions(parsed.suggestions);
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }

      // Mark streaming complete
      setMessages(prev => prev.map(m =>
        m.id === tempMessageId
          ? { ...m, streaming: false }
          : m
      ));

      // Generate next suggestions
      await generateSmartSuggestions('conversation', userMsg);

    } catch (err) {
      console.error('Error sending message:', err);
      addBotMessage(
        "I'm sorry, I encountered an error. Please try again or rephrase your question.",
        { isError: true }
      );
    } finally {
      setIsTyping(false);
    }
  };

  const handleSave = async () => {
    try {
      if (onSave) {
        await onSave(pluginConfig);
      }
    } catch (err) {
      console.error('Error saving plugin:', err);
    }
  };

  const renderMessage = (msg, index) => {
    const isBot = msg.role === 'assistant';

    return (
      <div key={index} className={`flex gap-3 ${isBot ? '' : 'flex-row-reverse'}`}>
        {/* Avatar */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isBot ? 'bg-purple-100' : 'bg-blue-100'
        }`}>
          {isBot ? (
            <Bot className="w-5 h-5 text-purple-600" />
          ) : (
            <User className="w-5 h-5 text-blue-600" />
          )}
        </div>

        {/* Message content */}
        <div className={`flex-1 max-w-[80%] ${isBot ? '' : 'flex justify-end'}`}>
          <div className={`rounded-lg p-4 ${
            isBot
              ? 'bg-white border border-gray-200'
              : 'bg-blue-600 text-white'
          }`}>
            <div className="whitespace-pre-wrap">{msg.content}</div>
            {msg.streaming && (
              <Loader2 className="w-4 h-4 animate-spin mt-2 text-gray-400" />
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-6 h-6 text-purple-600" />
                <h1 className="text-2xl font-bold text-gray-900">No-Code Plugin Builder</h1>
                <Badge className="bg-purple-100 text-purple-700">AI-Powered</Badge>
              </div>
              <p className="text-sm text-gray-600">
                {currentStep === 'start' && "Let's build something amazing together"}
                {currentStep === 'building' && "I'm learning about your needs..."}
                {currentStep === 'reviewing' && "Almost done! Let's review"}
                {currentStep === 'complete' && "Your plugin is ready!"}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSwitchMode?.('developer', pluginConfig)}
                className="gap-2"
              >
                <Code2 className="w-4 h-4" />
                Switch to Developer Mode
              </Button>
              <Button variant="ghost" onClick={onCancel}>Cancel</Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex gap-6 p-6 overflow-hidden">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-white rounded-lg shadow-lg overflow-hidden h-full">
          {/* Messages */}
          <div ref={chatContainerRef} className="h-[calc(100vh-180px)] flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg, idx) => renderMessage(msg, idx))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-purple-600" />
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            {/* Template selector (shown initially) */}
            {showTemplates && messages.length === 1 && (
              <div className="mt-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleTemplateSelect(template)}
                      className="p-4 border-2 border-gray-200 rounded-lg hover:border-purple-400 hover:shadow-md transition-all text-left"
                    >
                      <div className="text-3xl mb-2">{template.icon}</div>
                      <div className="font-semibold text-sm text-gray-900">{template.title}</div>
                      <div className="text-xs text-gray-600 mt-1">{template.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Smart suggestions */}
            {!isTyping && smartSuggestions.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-medium text-gray-700">Suggested questions:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {smartSuggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="px-4 py-2 bg-purple-50 border border-purple-200 rounded-full text-sm text-purple-700 hover:bg-purple-100 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t bg-gray-50 p-4">
            <div className="flex gap-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                placeholder="Type your message or click a suggestion above..."
                className="flex-1"
                disabled={isTyping}
              />
              <Button
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || isTyping}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>

            {/* Quick actions */}
            {currentStep !== 'start' && (
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => handleSuggestionClick("What features will this have?")}
                  className="text-xs text-gray-600 hover:text-purple-600 transition-colors"
                >
                  Add more features
                </button>
                <span className="text-gray-400">•</span>
                <button
                  onClick={() => handleSuggestionClick("Show me what you've built so far")}
                  className="text-xs text-gray-600 hover:text-purple-600 transition-colors"
                >
                  Review progress
                </button>
                <span className="text-gray-400">•</span>
                <button
                  onClick={() => handleSuggestionClick("I'm done, generate the plugin")}
                  className="text-xs text-gray-600 hover:text-purple-600 transition-colors"
                >
                  Finish & generate
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Progress & Info */}
        <div className="w-80 space-y-4 h-[calc(100vh-100px)] overflow-y-auto">
          {/* Progress Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-purple-600"/>
                Your Plugin
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pluginConfig.name ? (
                  <>
                    <div>
                      <div className="text-sm font-medium text-gray-700">Name</div>
                      <div className="text-gray-900">{pluginConfig.name}</div>
                    </div>
                    {pluginConfig.description && (
                        <div>
                          <div className="text-sm font-medium text-gray-700">Description</div>
                          <div className="text-sm text-gray-600">{pluginConfig.description}</div>
                        </div>
                    )}
                    {pluginConfig.features && pluginConfig.features.length > 0 && (
                        <div>
                          <div className="text-sm font-medium text-gray-700 mb-2">Features</div>
                          <div className="space-y-1">
                            {pluginConfig.features.map((feature, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-sm">
                                  <CheckCircle className="w-3 h-3 text-green-600"/>
                                  <span className="text-gray-700">{feature.name || feature.type}</span>
                                </div>
                            ))}
                          </div>
                        </div>
                    )}
                    {pluginConfig.generatedCode && (
                        <Button
                            onClick={handleSave}
                            className="w-full bg-green-600 hover:bg-green-700 gap-2"
                        >
                          <Zap className="w-4 h-4"/>
                          Deploy Plugin
                        </Button>
                    )}
                  </>
              ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Sparkles className="w-12 h-12 mx-auto mb-2 text-gray-400"/>
                    <p className="text-sm">Start chatting to build your plugin</p>
                  </div>
              )}
            </CardContent>
          </Card>

          {/* What's Already Built Card (shown when editing existing plugin) */}
          {isEditingExisting && (
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600"/>
                    What's Already Built
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {/* Show hooks */}
                  {pluginConfig.hooks && pluginConfig.hooks.length > 0 && (
                      <div>
                        <div className="font-medium text-gray-700 mb-1">Hooks ({pluginConfig.hooks.length})</div>
                        <div className="space-y-1">
                          {pluginConfig.hooks.map((hook, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-gray-600">
                                <span className="text-green-600">⚡</span>
                                <span className="text-xs">{hook.hook_name || hook.hookPoint || hook.name}</span>
                              </div>
                          ))}
                        </div>
                      </div>
                  )}

                  {/* Show event listeners */}
                  {pluginConfig.eventListeners && pluginConfig.eventListeners.length > 0 && (
                      <div>
                        <div className="font-medium text-gray-700 mb-1">Event Listeners
                          ({pluginConfig.eventListeners.length})
                        </div>
                        <div className="space-y-1">
                          {pluginConfig.eventListeners.map((listener, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-gray-600">
                                <span className="text-green-600">📡</span>
                                <span
                                    className="text-xs">{listener.event_name || listener.eventName || listener.name}</span>
                              </div>
                          ))}
                        </div>
                      </div>
                  )}

                  {/* Show code files */}
                  {((pluginConfig.controllers && pluginConfig.controllers.length > 0) ||
                      (pluginConfig.models && pluginConfig.models.length > 0) ||
                      (pluginConfig.components && pluginConfig.components.length > 0)) && (
                      <div>
                        <div className="font-medium text-gray-700 mb-1">Code Files</div>
                        <div className="space-y-1">
                          {pluginConfig.controllers && pluginConfig.controllers.length > 0 && (
                              <div className="flex items-center gap-2 text-gray-600">
                                <span className="text-green-600">📄</span>
                                <span className="text-xs">{pluginConfig.controllers.length} Controllers</span>
                              </div>
                          )}
                          {pluginConfig.models && pluginConfig.models.length > 0 && (
                              <div className="flex items-center gap-2 text-gray-600">
                                <span className="text-green-600">🗃️</span>
                                <span className="text-xs">{pluginConfig.models.length} Models</span>
                              </div>
                          )}
                          {pluginConfig.components && pluginConfig.components.length > 0 && (
                              <div className="flex items-center gap-2 text-gray-600">
                                <span className="text-green-600">🎨</span>
                                <span className="text-xs">{pluginConfig.components.length} Components</span>
                              </div>
                          )}
                        </div>
                      </div>
                  )}

                  {/* Show manifest info if available */}
                  {pluginConfig.manifest && (
                      <div>
                        <div className="font-medium text-gray-700 mb-1">Plugin Info</div>
                        <div className="space-y-1 text-xs text-gray-600">
                          {pluginConfig.version && (
                              <div>Version: {pluginConfig.version}</div>
                          )}
                          {pluginConfig.author && (
                              <div>Author: {pluginConfig.author}</div>
                          )}
                          {pluginConfig.category && (
                              <div className="capitalize">Category: {pluginConfig.category}</div>
                          )}
                        </div>
                      </div>
                  )}

                  {/* Empty state */}
                  {(!pluginConfig.hooks || pluginConfig.hooks.length === 0) &&
                      (!pluginConfig.eventListeners || pluginConfig.eventListeners.length === 0) &&
                      (!pluginConfig.controllers || pluginConfig.controllers.length === 0) &&
                      (!pluginConfig.models || pluginConfig.models.length === 0) &&
                      (!pluginConfig.components || pluginConfig.components.length === 0) && (
                          <div className="text-center py-4 text-gray-500">
                            <p className="text-xs">Loading plugin details...</p>
                            <p className="text-xs mt-1">Switch to Developer Mode to see code</p>
                          </div>
                      )}
                </CardContent>
              </Card>
          )}

          {/* Tips Card */}
          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-amber-600"/>
                Pro Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-gray-700">
              <div className="flex gap-2">
                <span className="text-amber-600">•</span>
                <span>Be specific about what you want the plugin to do</span>
              </div>
              <div className="flex gap-2">
                <span className="text-amber-600">•</span>
                <span>Mention if you need database storage or API endpoints</span>
              </div>
              <div className="flex gap-2">
                <span className="text-amber-600">•</span>
                <span>Describe who will use it and how</span>
              </div>
              <div className="flex gap-2">
                <span className="text-amber-600">•</span>
                <span>Ask questions if you're unsure about something</span>
              </div>
            </CardContent>
          </Card>

          {/* Need Help Card */}
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-4">
              <div className="text-sm text-gray-700">
                <strong className="block mb-2">
                  {isEditingExisting ? "Need ideas to enhance?" : "Not sure what to build?"}
                </strong>
                <p className="mb-3">Try asking:</p>
                <div className="space-y-2">
                  {starterQuestions.map((q, idx) => (
                      <button
                          key={idx}
                          onClick={() => handleSendMessage(q)}
                          className="block w-full text-left px-3 py-2 bg-white rounded border border-blue-200 hover:border-blue-400 hover:shadow-sm transition-all text-sm"
                      >
                        {q}
                      </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EnhancedNoCodeBuilder;
