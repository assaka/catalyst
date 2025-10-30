import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Sparkles, User, Bot, Code, Eye, Package, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import apiClient from '@/api/client';
import { User as UserEntity } from '@/api/entities';
import { useStoreSelection } from '@/contexts/StoreSelectionContext';

/**
 * ChatInterface - Conversational AI for AI Studio
 * User chats naturally, AI determines what to do (like Bolt, Lovable, v0)
 */
const ChatInterface = ({ onPluginCloned, context }) => {
  const { getSelectedStoreId } = useStoreSelection();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm your AI assistant. I can help you:\n\n• Create and edit plugins\n• Translate products, categories, and content\n• Generate page layouts\n• Modify code\n\nWhat would you like to build today?"
    }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [starterTemplates, setStarterTemplates] = useState([]);
  const [cloningTemplate, setCloningTemplate] = useState(false);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [templateToClone, setTemplateToClone] = useState(null);
  const [cloneName, setCloneName] = useState('');
  const [pluginGenerationCost, setPluginGenerationCost] = useState(50); // Default fallback
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Load starter templates and plugin cost from API
  useEffect(() => {
    loadStarterTemplates();
    loadPluginGenerationCost();
  }, []);

  const loadPluginGenerationCost = async () => {
    try {
      const response = await apiClient.get('service-credit-costs/key/custom_plugin_creation');
      if (response.success && response.service) {
        setPluginGenerationCost(response.service.cost_per_unit);
      }
    } catch (error) {
      console.error('Error loading plugin generation cost:', error);
      // Keep using default fallback value
    }
  };

  const loadStarterTemplates = async () => {
    try {
      const response = await apiClient.get('/plugins/starters');
      if (response.success && response.starters) {
        setStarterTemplates(response.starters);
      }
    } catch (error) {
      console.error('Failed to load starter templates:', error);
      // Fallback to empty array if API fails
      setStarterTemplates([]);
    }
  };

  const handleCloneTemplate = (template) => {
    setTemplateToClone(template);
    setCloneName(`My ${template.name}`);
    setShowCloneModal(true);
  };

  const confirmCloneTemplate = async () => {
    if (!cloneName.trim()) {
      alert('Plugin name cannot be empty');
      return;
    }

    setShowCloneModal(false);
    setCloningTemplate(true);

    try {
      // Get current user
      const currentUser = await UserEntity.me();

      // Export the template plugin
      const exportData = await apiClient.get(`plugins/${templateToClone.id}/export`);

      // Modify the package with new name and user ID
      exportData.plugin.name = cloneName.trim();
      exportData.plugin.slug = cloneName.trim().toLowerCase().replace(/\s+/g, '-');
      exportData.userId = currentUser?.id;

      // Import as new plugin
      const result = await apiClient.post('plugins/import', exportData);

      // Show success message
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `✅ Created "${cloneName}" from ${templateToClone.name} template!\n\nYour plugin is ready with all files, events, and widgets. Opening in editor...`,
        data: result.plugin
      }]);

      // Notify parent to open in editor
      if (onPluginCloned) {
        onPluginCloned(result.plugin);
      }

    } catch (error) {
      console.error('Failed to clone template:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `❌ Error cloning template: ${error.message}`,
        error: true
      }]);
    } finally {
      setCloningTemplate(false);
      setTemplateToClone(null);
      setCloneName('');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

    const userMessage = input.trim();

    // Detect if user is asking to create/generate a plugin
    const isPluginRequest = /create|generate|build|make|add.*plugin/i.test(userMessage);

    setInput('');

    // Add user message to chat
    setMessages(prev => [...prev, {
      role: 'user',
      content: userMessage
    }]);

    // If it's a plugin creation request, show confirmation first
    if (isPluginRequest) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `🤖 I can generate a plugin for you!\n\n⚠️ **Cost:** ${pluginGenerationCost} credits for AI generation\n\nAfter generation, you can:\n• Preview the code\n• Edit if needed\n• Save to database automatically\n\nDo you want me to generate this plugin?`,
        confirmAction: {
          type: 'generate-plugin',
          prompt: userMessage,
          cost: pluginGenerationCost
        }
      }]);
      return;
    }

    // For non-plugin requests, proceed normally
    setIsProcessing(true);

    try {
      // Send to AI chat endpoint - AI determines what to do
      const response = await apiClient.post('/ai/chat', {
        message: userMessage,
        conversationHistory: messages,
        storeId: getSelectedStoreId()
      });

      if (response.success) {
        // Add AI response with any generated content
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: response.message,
          data: response.data, // Plugin, translation, layout data
          credits: response.creditsDeducted
        }]);
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `Error: ${response.message || 'Something went wrong'}`,
          error: true
        }]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Error: ${error.message || 'Failed to process your request'}`,
        error: true
      }]);
    } finally {
      setIsProcessing(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleGeneratePlugin = async (prompt) => {
    setIsProcessing(true);

    try {
      // Send to AI chat endpoint for plugin generation
      const response = await apiClient.post('/ai/chat', {
        message: prompt,
        conversationHistory: messages,
        storeId: getSelectedStoreId()
      });

      if (response.success) {
        // Add AI response with generated plugin
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: response.message,
          data: response.data,
          credits: response.creditsDeducted
        }]);
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `Error: ${response.message || 'Failed to generate plugin'}`,
          error: true
        }]);
      }
    } catch (error) {
      console.error('Plugin generation error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Error: ${error.message || 'Failed to generate plugin'}`,
        error: true
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmCreate = (pluginData) => {
    // Directly install the plugin without confirmation
    handleInstallPlugin(pluginData);
  };

  const handleInstallPlugin = async (pluginData) => {
    try {
      // Call the new /api/ai/plugin/create endpoint
      const response = await apiClient.post('/ai/plugin/create', {
        pluginData
      });

      if (response.success) {
        // Add success message
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `✅ Plugin "${pluginData.name}" created successfully!\n\nOpening in editor...`,
        }]);

        // Notify parent to open in editor
        if (onPluginCloned) {
          onPluginCloned({
            ...pluginData,
            id: response.pluginId,
            slug: response.plugin.slug
          });
        }
      } else {
        throw new Error(response.message || 'Failed to create plugin');
      }
    } catch (error) {
      console.error('Failed to create plugin:', error);

      // Add error message
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `❌ Error creating plugin: ${error.message}`,
        error: true
      }]);

      throw error;
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <MessageBubble
            key={index}
            message={message}
            onInstallPlugin={handleInstallPlugin}
            onConfirmCreate={handleConfirmCreate}
            onGeneratePlugin={handleGeneratePlugin}
          />
        ))}

        {/* Starter Templates - show only when creating new plugin (not editing) */}
        {messages.length === 1 && !isProcessing && !cloningTemplate && !context?.plugin && starterTemplates.length > 0 && (
          <div className="mt-6 space-y-3">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Or start with a template:
            </p>
            <div className="grid grid-cols-1 gap-2">
              {starterTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleCloneTemplate(template)}
                  className="flex items-start w-fit gap-3 p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors text-left"
                >
                  <span className="text-2xl flex-shrink-0">{template.icon}</span>
                  <div>
                    <div className="font-medium text-sm text-gray-900">{template.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{template.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Cloning indicator */}
        {cloningTemplate && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0">
              <Package className="w-4 h-4 text-white" />
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Cloning template...</span>
            </div>
          </div>
        )}

        {isProcessing && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Describe what you want to build... (Press Enter to send)"
              className={cn(
                "w-full p-3 text-sm border rounded-lg resize-none",
                "focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                "dark:bg-gray-900 dark:border-gray-600 dark:text-gray-100",
                "placeholder-gray-400 dark:placeholder-gray-500",
                "max-h-32"
              )}
              rows={1}
              disabled={isProcessing}
              style={{
                minHeight: '44px',
                height: 'auto'
              }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || isProcessing}
            className={cn(
              "p-3 rounded-lg",
              "bg-blue-600 hover:bg-blue-700",
              "text-white",
              "disabled:bg-gray-300 disabled:cursor-not-allowed",
              "transition-colors flex-shrink-0"
            )}
          >
            {isProcessing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
          Press Enter to send • Shift+Enter for new line
        </p>
      </div>

      {/* Clone Template Modal */}
      {showCloneModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Clone Template Plugin</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template
                </label>
                <div className="p-3 bg-purple-50 border border-purple-200 rounded flex items-center gap-2">
                  <span className="text-2xl">{templateToClone?.icon}</span>
                  <div>
                    <div className="font-medium text-sm">{templateToClone?.name}</div>
                    <div className="text-xs text-gray-500">{templateToClone?.description}</div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Plugin Name
                </label>
                <input
                  type="text"
                  value={cloneName}
                  onChange={(e) => setCloneName(e.target.value)}
                  placeholder="Enter plugin name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') confirmCloneTemplate();
                    if (e.key === 'Escape') {
                      setShowCloneModal(false);
                      setTemplateToClone(null);
                      setCloneName('');
                    }
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">
                  This will create a complete copy with all files, events, and widgets
                </p>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={confirmCloneTemplate}
                disabled={!cloneName.trim()}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Clone Plugin
              </button>
              <button
                onClick={() => {
                  setShowCloneModal(false);
                  setTemplateToClone(null);
                  setCloneName('');
                }}
                className="flex-1 border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * MessageBubble - Renders individual chat messages with generated content
 */
const MessageBubble = ({ message, onInstallPlugin, onConfirmCreate, onGeneratePlugin }) => {
  const [showCode, setShowCode] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const isUser = message.role === 'user';
  const isError = message.error;

  return (
    <div className={cn("flex items-start gap-3", isUser && "flex-row-reverse")}>
      {/* Avatar */}
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
        isUser
          ? "bg-gray-200 dark:bg-gray-700"
          : "bg-gradient-to-br from-blue-500 to-purple-600"
      )}>
        {isUser ? (
          <User className="w-4 h-4 text-gray-600 dark:text-gray-300" />
        ) : (
          <Bot className="w-4 h-4 text-white" />
        )}
      </div>

      {/* Message Content */}
      <div className={cn(
        "flex-1 max-w-[80%]",
        isUser && "flex flex-col items-end"
      )}>
        <div className={cn(
          "rounded-lg p-3",
          isUser
            ? "bg-blue-600 text-white"
            : isError
            ? "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400"
            : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        )}>
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>

          {/* Credits Used */}
          {message.credits && !isUser && (
            <p className="text-xs mt-2 opacity-70">
              {message.credits} credits used
            </p>
          )}

          {/* Confirmation Actions */}
          {message.confirmAction && !isUser && (
            <div className="flex gap-2 mt-3">
              <button
                onClick={async () => {
                  if (message.confirmAction.type === 'generate-plugin') {
                    // Remove confirmAction from this message
                    setMessages(prev => prev.map(m =>
                      m === message ? { ...m, confirmAction: null } : m
                    ));
                    // Generate plugin via AI
                    await onGeneratePlugin(message.confirmAction.prompt);
                  } else if (message.confirmAction.type === 'create-plugin') {
                    // Remove confirmAction from this message
                    setMessages(prev => prev.map(m =>
                      m === message ? { ...m, confirmAction: null } : m
                    ));
                    // Save plugin to database
                    await onInstallPlugin(message.confirmAction.pluginData);
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md font-medium"
              >
                ✓ Yes, Proceed
              </button>
              <button
                onClick={() => {
                  // Remove confirmAction and add cancellation message in one update for smooth visual feedback
                  setMessages(prev => [
                    ...prev.map(m => m === message ? { ...m, confirmAction: null } : m),
                    {
                      role: 'assistant',
                      content: '❌ Cancelled. What else can I help you with?'
                    }
                  ]);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm rounded-md font-medium"
              >
                ✗ Cancel
              </button>
            </div>
          )}
        </div>

        {/* Generated Plugin Preview */}
        {message.data?.type === 'plugin' && !isUser && (
          <div className="mt-3 w-full border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  {message.data.plugin.name}
                </h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {message.data.plugin.description}
              </p>
            </div>

            {/* Plugin Actions */}
            <div className="p-3 flex items-center justify-between bg-white dark:bg-gray-800">
              <button
                onClick={() => setShowCode(!showCode)}
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                {showCode ? <Eye className="w-4 h-4" /> : <Code className="w-4 h-4" />}
                {showCode ? 'Hide' : 'View'} Code
              </button>
              <button
                onClick={() => {
                  // Show confirmation instead of creating immediately
                  onConfirmCreate(message.data.plugin);
                }}
                disabled={isInstalling}
                className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white text-sm rounded-md"
              >
                <Download className="w-4 h-4" />
                Create Plugin
              </button>
            </div>

            {/* Code View */}
            {showCode && message.data.plugin.generatedFiles && (
              <div className="border-t border-gray-200 dark:border-gray-700">
                {message.data.plugin.generatedFiles.map((file, idx) => (
                  <div key={idx}>
                    <div className="px-3 py-2 bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-xs font-mono text-gray-700 dark:text-gray-300">
                        {file.name}
                      </span>
                    </div>
                    <pre className="p-3 bg-gray-900 text-gray-100 text-xs overflow-x-auto">
                      <code>{file.code}</code>
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Generated Translation Results */}
        {message.data?.type === 'translation' && !isUser && (
          <div className="mt-3 w-full border border-green-200 dark:border-green-800 rounded-lg overflow-hidden bg-green-50 dark:bg-green-950">
            <div className="p-3">
              <p className="text-sm text-green-800 dark:text-green-200 font-medium mb-2">
                ✓ {message.data.summary}
              </p>
              {message.data.details && message.data.details.map((detail, idx) => (
                <p key={idx} className="text-xs text-green-700 dark:text-green-300">
                  • {detail.entityType}: {detail.count} items → {detail.languages.join(', ')}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Generated Layout Preview */}
        {message.data?.type === 'layout' && !isUser && (
          <div className="mt-3 w-full border border-purple-200 dark:border-purple-800 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
            <div className="p-3 border-b border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950">
              <p className="text-sm text-purple-900 dark:text-purple-100 font-medium">
                Layout generated for {message.data.configType}
              </p>
            </div>
            <div className="p-3">
              <button
                onClick={() => setShowCode(!showCode)}
                className="text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 mb-2"
              >
                {showCode ? 'Hide' : 'View'} Configuration
              </button>
              {showCode && (
                <pre className="p-3 bg-gray-900 text-gray-100 text-xs overflow-x-auto rounded">
                  <code>{message.data.config}</code>
                </pre>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;
