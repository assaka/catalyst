import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Sparkles, User, Bot, Code, Eye, Package, Download, ThumbsUp, ThumbsDown, ChevronDown, Zap, Brain, Cpu } from 'lucide-react';
import { cn } from '@/lib/utils';
import apiClient from '@/api/client';
import { User as UserEntity } from '@/api/entities';
import { useStoreSelection } from '@/contexts/StoreSelectionContext';
import { useAIWorkspace } from '@/contexts/AIWorkspaceContext';

/**
 * ChatInterface - Conversational AI for AI Studio
 * User chats naturally, AI determines what to do (like Bolt, Lovable, v0)
 */
// All available AI models (for future model selection within providers)
const ALL_AI_MODELS = [
  { id: 'claude-haiku', name: 'Claude Haiku', provider: 'anthropic', credits: 2, icon: '⚡', description: 'Fast & affordable', serviceKey: 'ai_chat_claude_haiku' },
  { id: 'claude-sonnet', name: 'Claude Sonnet', provider: 'anthropic', credits: 8, icon: '🎯', description: 'Balanced', serviceKey: 'ai_chat_claude_sonnet', isProviderDefault: true },
  { id: 'claude-opus', name: 'Claude Opus', provider: 'anthropic', credits: 25, icon: '👑', description: 'Most capable', serviceKey: 'ai_chat_claude_opus' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai', credits: 3, icon: '🚀', description: 'Fast & efficient', serviceKey: 'ai_chat_gpt4o_mini', isProviderDefault: true },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', credits: 15, icon: '🧠', description: 'Latest flagship', serviceKey: 'ai_chat_gpt4o' },
  { id: 'gemini-flash', name: 'Gemini Flash', provider: 'gemini', credits: 1.5, icon: '💨', description: 'Ultra fast', serviceKey: 'ai_chat_gemini_flash', isProviderDefault: true },
  { id: 'gemini-pro', name: 'Gemini Pro', provider: 'gemini', credits: 10, icon: '💎', description: 'Advanced reasoning', serviceKey: 'ai_chat_gemini_pro' },
  { id: 'groq-llama', name: 'Groq Llama', provider: 'groq', credits: 1, icon: '🦙', description: 'Lightning fast', serviceKey: 'ai_chat_groq_llama', isProviderDefault: true },
  { id: 'groq-mixtral', name: 'Groq Mixtral', provider: 'groq', credits: 0.5, icon: '🌀', description: 'Fast MoE', serviceKey: 'ai_chat_groq_mixtral' },
];

// Provider display names
const PROVIDER_NAMES = {
  anthropic: 'Claude',
  openai: 'OpenAI',
  gemini: 'Gemini',
  groq: 'Groq'
};

// Show only default model per provider in dropdown
const AI_MODELS = ALL_AI_MODELS.filter(m => m.isProviderDefault);

// Get saved model preference from localStorage
const getSavedModel = () => {
  try {
    const saved = localStorage.getItem('ai_default_model');
    if (saved && AI_MODELS.find(m => m.id === saved)) {
      return saved;
    }
  } catch (e) {}
  return 'claude-sonnet'; // Default to Claude Sonnet
};

const ChatInterface = ({ onPluginCloned, context }) => {
  const { getSelectedStoreId } = useStoreSelection();
  const { refreshPreview, triggerConfigurationRefresh } = useAIWorkspace();
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
  const [inputHistory, setInputHistory] = useState([]); // Arrow up/down history
  const [historyIndex, setHistoryIndex] = useState(-1); // Current position in history
  const [sessionId] = useState(() => `session_${Date.now()}`); // Session ID for grouping
  const [selectedModel, setSelectedModel] = useState(getSavedModel);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Load starter templates, plugin cost, and chat history
  useEffect(() => {
    loadStarterTemplates();
    loadPluginGenerationCost();
    loadChatHistory();
    loadInputHistory();
  }, []);

  // Close model dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowModelDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get current selected model object
  const currentModel = AI_MODELS.find(m => m.id === selectedModel) || AI_MODELS[0];

  // Load chat history from tenant DB
  const loadChatHistory = async () => {
    try {
      const storeId = getSelectedStoreId();
      if (!storeId) return;

      const response = await apiClient.get('/ai/chat/history', {
        params: { store_id: storeId, limit: 50 }
      });

      if (response.success && response.messages?.length > 0) {
        // Prepend welcome message, then add history
        const historyMessages = response.messages.map(m => ({
          role: m.role,
          content: m.content,
          data: m.data,
          credits: m.credits_used,
          error: m.is_error
        }));
        setMessages(prev => [...prev, ...historyMessages]);
      }
    } catch (error) {
      console.error('[ChatInterface] Failed to load chat history:', error);
    }
  };

  // Load input history for arrow navigation
  const loadInputHistory = async () => {
    try {
      const storeId = getSelectedStoreId();
      if (!storeId) return;

      const response = await apiClient.get('/ai/chat/input-history', {
        params: { store_id: storeId, limit: 20 }
      });

      if (response.success && response.inputs) {
        setInputHistory(response.inputs);
      }
    } catch (error) {
      console.error('[ChatInterface] Failed to load input history:', error);
    }
  };

  // Save message to chat history
  const saveChatMessage = async (role, content, data = null, creditsUsed = 0, isError = false) => {
    try {
      const storeId = getSelectedStoreId();
      if (!storeId) return;

      await apiClient.post('/ai/chat/history', {
        storeId,
        sessionId,
        role,
        content,
        intent: data?.type,
        data,
        creditsUsed,
        isError
      });
    } catch (error) {
      console.error('[ChatInterface] Failed to save chat message:', error);
    }
  };

  // Save input to history
  const saveInputHistory = async (inputText) => {
    try {
      const storeId = getSelectedStoreId();
      if (!storeId) return;

      await apiClient.post('/ai/chat/input-history', {
        storeId,
        input: inputText
      });

      // Update local state
      setInputHistory(prev => [inputText, ...prev.slice(0, 19)]);
    } catch (error) {
      console.error('[ChatInterface] Failed to save input history:', error);
    }
  };

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
    setInput('');
    setHistoryIndex(-1); // Reset history navigation

    // Save to input history for arrow navigation
    saveInputHistory(userMessage);

    // Add user message to chat
    setMessages(prev => [...prev, {
      role: 'user',
      content: userMessage
    }]);

    // Save user message to chat history
    saveChatMessage('user', userMessage);

    // Send all requests to backend - AI determines intent
    setIsProcessing(true);

    try {
      // Send to AI chat endpoint - AI determines what to do
      const response = await apiClient.post('/ai/chat', {
        message: userMessage,
        conversationHistory: messages,
        storeId: getSelectedStoreId(),
        modelId: selectedModel,
        serviceKey: currentModel.serviceKey
      });

      if (response.success) {
        // Check if this is a plugin confirmation request
        if (response.data?.type === 'plugin_confirmation') {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: response.message,
            confirmAction: {
              type: 'generate-plugin',
              prompt: response.data.prompt,
              category: response.data.category
            }
          }]);
          return;
        }

        // Add AI response with any generated content
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: response.message,
          data: response.data, // Plugin, translation, layout, styling data
          credits: response.creditsDeducted
        }]);

        // Save assistant message to chat history
        saveChatMessage('assistant', response.message, response.data, response.creditsDeducted, false);

        // Debug: Log response data to check type
        console.log('[ChatInterface] Response data:', response.data);
        console.log('[ChatInterface] Response data type:', response.data?.type);

        // Auto-refresh preview and editor after styling/layout changes
        const refreshTypes = ['styling_applied', 'styling_preview', 'multi_intent', 'layout_modified', 'settings_updated'];
        if (refreshTypes.includes(response.data?.type)) {
          console.log('[ChatInterface] Triggering refresh for:', response.data?.type);
          setTimeout(() => {
            refreshPreview?.();
            triggerConfigurationRefresh?.();

            // Dispatch localStorage event to trigger reload in page editors
            const storeId = getSelectedStoreId();
            const pageType = response.data?.pageType || 'product';
            localStorage.setItem('slot_config_updated', JSON.stringify({
              storeId,
              pageType,
              timestamp: Date.now()
            }));
            // Dispatch storage event for same-window listeners
            window.dispatchEvent(new StorageEvent('storage', {
              key: 'slot_config_updated',
              newValue: JSON.stringify({ storeId, pageType, timestamp: Date.now() })
            }));

            // For settings updates, also broadcast to StoreProvider channel to refresh store settings
            if (response.data?.type === 'settings_updated') {
              try {
                const storeChannel = new BroadcastChannel('store_settings_update');
                storeChannel.postMessage({ type: 'clear_cache' });
                storeChannel.close();
              } catch (e) {
                console.warn('BroadcastChannel not supported:', e);
              }
            }
          }, 500);
        }
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
    } else if (e.key === 'ArrowUp' && inputHistory.length > 0 && !input.includes('\n')) {
      // Arrow up for input history (only if not multi-line)
      e.preventDefault();
      const newIndex = historyIndex < inputHistory.length - 1 ? historyIndex + 1 : historyIndex;
      setHistoryIndex(newIndex);
      setInput(inputHistory[newIndex] || '');
    } else if (e.key === 'ArrowDown' && historyIndex >= 0 && !input.includes('\n')) {
      // Arrow down for input history
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(inputHistory[newIndex] || '');
      } else {
        setHistoryIndex(-1);
        setInput('');
      }
    }
  };

  const handleGeneratePlugin = async (prompt) => {
    setIsProcessing(true);

    try {
      // Send confirmed plugin generation request
      const response = await apiClient.post('/ai/chat', {
        message: prompt,
        conversationHistory: messages,
        storeId: getSelectedStoreId(),
        confirmedPlugin: true  // This tells backend to actually generate, not ask again
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

  const handleCancelConfirmation = (message) => {
    // Remove confirmAction and add cancellation message
    setMessages(prev => [
      ...prev.map(m => m === message ? { ...m, confirmAction: null } : m),
      {
        role: 'assistant',
        content: '❌ Cancelled. What else can I help you with?'
      }
    ]);
  };

  // Handle feedback submission for self-learning
  const handleFeedback = async (message, wasHelpful) => {
    try {
      const storeId = getSelectedStoreId();

      // Find the user message that prompted this response
      const messageIndex = messages.indexOf(message);
      const userMessage = messageIndex > 0 ? messages[messageIndex - 1] : null;

      await apiClient.post('/ai-learning/feedback', {
        storeId,
        conversationId: Date.now().toString(), // Simple session ID
        messageId: messageIndex.toString(),
        userMessage: userMessage?.content || '',
        aiResponse: message.content,
        intent: message.data?.type || 'chat',
        entity: message.data?.entity || null,
        operation: message.data?.operation || null,
        wasHelpful,
        feedbackText: null
      });

      console.log('[AI Learning] Feedback recorded:', wasHelpful ? 'helpful' : 'not helpful');
    } catch (error) {
      console.error('[AI Learning] Failed to record feedback:', error);
      // Don't show error to user - feedback is non-critical
    }
  };

  const handleRemoveConfirmAction = (message) => {
    // Remove confirmAction from message
    setMessages(prev => prev.map(m =>
      m === message ? { ...m, confirmAction: null } : m
    ));
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
            onCancelConfirmation={handleCancelConfirmation}
            onRemoveConfirmAction={handleRemoveConfirmAction}
            onFeedback={handleFeedback}
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
        {/* Model Selection */}
        <div className="mb-3 relative" ref={dropdownRef}>
          <button
            onClick={() => setShowModelDropdown(!showModelDropdown)}
            disabled={isProcessing}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg border transition-all",
              "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-600",
              "hover:border-blue-400 dark:hover:border-blue-500",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            <span className="text-base">{currentModel.icon}</span>
            <span className="font-medium text-gray-700 dark:text-gray-200">{PROVIDER_NAMES[currentModel.provider]}</span>
            <span className="text-gray-400 dark:text-gray-500">•</span>
            <span className="text-blue-600 dark:text-blue-400 font-medium">{currentModel.credits} cr</span>
            <ChevronDown className={cn("w-3.5 h-3.5 text-gray-400 transition-transform", showModelDropdown && "rotate-180")} />
          </button>

          {/* Dropdown Menu */}
          {showModelDropdown && (
            <div className="absolute bottom-full left-0 mb-1 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50 overflow-hidden">
              <div className="p-2 border-b border-gray-100 dark:border-gray-700">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 px-2">Select AI Provider</p>
              </div>
              <div className="py-1">
                {AI_MODELS.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => {
                      setSelectedModel(model.id);
                      localStorage.setItem('ai_default_model', model.id); // Save preference
                      setShowModelDropdown(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors",
                      selectedModel === model.id
                        ? "bg-blue-50 dark:bg-blue-900/30 border-l-2 border-blue-500"
                        : "hover:bg-gray-50 dark:hover:bg-gray-700/50 border-l-2 border-transparent"
                    )}
                  >
                    <span className="text-xl">{model.icon}</span>
                    <div className="flex-1 min-w-0">
                      <span className={cn(
                        "text-sm font-medium block",
                        selectedModel === model.id ? "text-blue-600 dark:text-blue-400" : "text-gray-800 dark:text-gray-200"
                      )}>
                        {PROVIDER_NAMES[model.provider]}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{model.name}</span>
                    </div>
                    <div className={cn(
                      "text-xs font-semibold px-2 py-1 rounded-full",
                      selectedModel === model.id
                        ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                    )}>
                      {model.credits} cr
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

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
const MessageBubble = ({ message, onInstallPlugin, onConfirmCreate, onGeneratePlugin, onCancelConfirmation, onRemoveConfirmAction, onFeedback }) => {
  const [showCode, setShowCode] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState(null); // 'helpful' or 'not_helpful'
  const isUser = message.role === 'user';
  const isError = message.error;

  const handleFeedback = async (wasHelpful) => {
    setFeedbackGiven(wasHelpful ? 'helpful' : 'not_helpful');
    if (onFeedback) {
      onFeedback(message, wasHelpful);
    }
  };

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

          {/* Feedback Buttons - only show for actual AI responses (has credits or data from API) */}
          {!isUser && !isError && !message.confirmAction && (message.data !== undefined || message.credits !== undefined) && (
            <div className="flex items-center gap-3 mt-3 pt-2 border-t border-gray-300 dark:border-gray-600">
              {feedbackGiven ? (
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {feedbackGiven === 'helpful' ? '👍 Thanks for your feedback!' : '👎 Thanks, we\'ll improve'}
                </span>
              ) : (
                <>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Was this helpful?</span>
                  <button
                    onClick={() => handleFeedback(true)}
                    className="p-1.5 hover:bg-green-100 dark:hover:bg-green-900/50 rounded-md transition-colors border border-transparent hover:border-green-300"
                    title="Yes, helpful"
                  >
                    <ThumbsUp className="w-4 h-4 text-gray-500 hover:text-green-600" />
                  </button>
                  <button
                    onClick={() => handleFeedback(false)}
                    className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-md transition-colors border border-transparent hover:border-red-300"
                    title="Not helpful"
                  >
                    <ThumbsDown className="w-4 h-4 text-gray-500 hover:text-red-600" />
                  </button>
                </>
              )}
            </div>
          )}

          {/* Confirmation Actions */}
          {message.confirmAction && !isUser && (
            <div className="flex gap-2 mt-3">
              <button
                onClick={async () => {
                  if (message.confirmAction.type === 'generate-plugin') {
                    // Remove confirmAction from this message
                    onRemoveConfirmAction(message);
                    // Generate plugin via AI
                    await onGeneratePlugin(message.confirmAction.prompt);
                  } else if (message.confirmAction.type === 'create-plugin') {
                    // Remove confirmAction from this message
                    onRemoveConfirmAction(message);
                    // Save plugin to database
                    await onInstallPlugin(message.confirmAction.pluginData);
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md font-medium"
              >
                ✓ Yes, Proceed
              </button>
              <button
                onClick={() => onCancelConfirmation(message)}
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
