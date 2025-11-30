import React, { useState, useRef, useEffect } from 'react';
import { useAIWorkspace } from '@/contexts/AIWorkspaceContext';
import { useStoreSelection } from '@/contexts/StoreSelectionContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import {
  Send,
  Loader2,
  Bot,
  User,
  Sparkles,
  Trash2,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Package,
  Code,
  Eye,
  Download
} from 'lucide-react';
import { cn } from '@/lib/utils';
import aiWorkspaceSlotProcessor from '@/services/aiWorkspaceSlotProcessor';
import apiClient from '@/api/client';
import { User as UserEntity } from '@/api/entities';

/**
 * WorkspaceAIPanel - AI Chat panel for the workspace
 * Handles AI conversations and slot manipulation commands
 */

const WorkspaceAIPanel = () => {
  const {
    chatMessages,
    addChatMessage,
    clearChatHistory,
    isProcessingAi,
    setIsProcessingAi,
    selectedPageType,
    applyAiSlotChange,
    undoLastAiOperation,
    lastAiOperation,
    currentConfiguration,
    slotHandlers,
    openPluginEditor
  } = useAIWorkspace();

  const { getSelectedStoreId } = useStoreSelection();
  const [inputValue, setInputValue] = useState('');
  const [commandStatus, setCommandStatus] = useState(null); // 'success', 'error', null
  const scrollAreaRef = useRef(null);
  const inputRef = useRef(null);

  // Plugin-related state
  const [starterTemplates, setStarterTemplates] = useState([]);
  const [cloningTemplate, setCloningTemplate] = useState(false);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [templateToClone, setTemplateToClone] = useState(null);
  const [cloneName, setCloneName] = useState('');
  const [pluginGenerationCost, setPluginGenerationCost] = useState(50);

  // Get storeId from context
  const storeId = getSelectedStoreId();

  // Load starter templates and plugin cost
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
      return;
    }

    setShowCloneModal(false);
    setCloningTemplate(true);

    try {
      const currentUser = await UserEntity.me();
      const exportData = await apiClient.get(`plugins/${templateToClone.id}/export`);

      exportData.plugin.name = cloneName.trim();
      exportData.plugin.slug = cloneName.trim().toLowerCase().replace(/\s+/g, '-');
      exportData.userId = currentUser?.id;

      const result = await apiClient.post('plugins/import', exportData);

      addChatMessage({
        role: 'assistant',
        content: `✅ Created "${cloneName}" from ${templateToClone.name} template!\n\nYour plugin is ready. Opening in editor...`,
        data: { type: 'plugin', plugin: result.plugin }
      });

      // Open plugin editor
      openPluginEditor(result.plugin);

    } catch (error) {
      console.error('Failed to clone template:', error);
      addChatMessage({
        role: 'assistant',
        content: `❌ Error cloning template: ${error.message}`,
        error: true
      });
    } finally {
      setCloningTemplate(false);
      setTemplateToClone(null);
      setCloneName('');
    }
  };

  const handleInstallPlugin = async (pluginData) => {
    try {
      const response = await apiClient.post('/ai/plugin/create', { pluginData });

      if (response.success) {
        addChatMessage({
          role: 'assistant',
          content: `✅ Plugin "${pluginData.name}" created successfully!\n\nOpening in editor...`,
        });

        openPluginEditor({
          ...pluginData,
          id: response.pluginId,
          slug: response.plugin.slug
        });
      } else {
        throw new Error(response.message || 'Failed to create plugin');
      }
    } catch (error) {
      console.error('Failed to create plugin:', error);
      addChatMessage({
        role: 'assistant',
        content: `❌ Error creating plugin: ${error.message}`,
        error: true
      });
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [chatMessages]);

  // Execute slot commands from AI response
  const executeSlotCommands = (commands) => {
    if (!commands || commands.length === 0 || !slotHandlers) return { success: false, error: 'No commands to execute' };

    let executedCount = 0;
    const errors = [];

    for (const command of commands) {
      // Validate command against current configuration
      const validation = aiWorkspaceSlotProcessor.validateCommand(command, currentConfiguration);
      if (!validation.valid) {
        errors.push(...validation.errors);
        continue;
      }

      try {
        // Execute the command using slot handlers
        const currentSlots = currentConfiguration?.slots || {};
        const updatedSlots = aiWorkspaceSlotProcessor.executeCommand(command, currentSlots, slotHandlers);

        // Apply the change through context
        if (updatedSlots && applyAiSlotChange) {
          applyAiSlotChange(updatedSlots, command);
          executedCount++;
        }
      } catch (err) {
        console.error('Error executing slot command:', err);
        errors.push(err.message);
      }
    }

    return {
      success: executedCount > 0,
      executed: executedCount,
      total: commands.length,
      errors
    };
  };

  // Generate plugin via AI
  const handleGeneratePlugin = async (prompt) => {
    setIsProcessingAi(true);

    try {
      const response = await apiClient.post('/ai/chat', {
        message: prompt,
        conversationHistory: chatMessages.slice(-10),
        storeId: storeId
      });

      if (response.success) {
        addChatMessage({
          role: 'assistant',
          content: response.message,
          data: response.data,
          credits: response.creditsDeducted
        });
      } else {
        addChatMessage({
          role: 'assistant',
          content: `Error: ${response.message || 'Failed to generate plugin'}`,
          error: true
        });
      }
    } catch (error) {
      console.error('Plugin generation error:', error);
      addChatMessage({
        role: 'assistant',
        content: `Error: ${error.message || 'Failed to generate plugin'}`,
        error: true
      });
    } finally {
      setIsProcessingAi(false);
    }
  };

  // Handle sending a message
  const handleSend = async () => {
    if (!inputValue.trim() || isProcessingAi) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setCommandStatus(null);

    // Detect if user is asking to create/generate a plugin
    const isPluginRequest = /create|generate|build|make|add.*plugin/i.test(userMessage);

    // Add user message to chat
    addChatMessage({
      role: 'user',
      content: userMessage
    });

    // If it's a plugin creation request, show confirmation first
    if (isPluginRequest) {
      addChatMessage({
        role: 'assistant',
        content: `🤖 I can generate a plugin for you!\n\n⚠️ **Cost:** ${pluginGenerationCost} credits for AI generation\n\nAfter generation, you can:\n• Preview the code\n• Edit if needed\n• Save to database automatically\n\nDo you want me to generate this plugin?`,
        confirmAction: {
          type: 'generate-plugin',
          prompt: userMessage,
          cost: pluginGenerationCost
        }
      });
      return;
    }

    setIsProcessingAi(true);

    try {
      // Generate slot context for AI
      const slotContext = aiWorkspaceSlotProcessor.generateSlotContext(
        selectedPageType,
        currentConfiguration
      );

      // Call backend AI service
      const response = await apiClient.post('ai-studio/chat', {
        message: userMessage,
        context: selectedPageType,
        history: chatMessages.slice(-10).map(m => ({ role: m.role, content: m.content })),
        capabilities: [
          'Add slots', 'Modify slots', 'Remove slots',
          'Resize slots', 'Move slots', 'Reorder slots',
          'Create plugins', 'Edit plugins'
        ],
        storeId: storeId,
        slotContext // Pass current layout info
      });

      // Check if response contains slot commands
      let commands = response.commands || [];

      // Also try to parse commands from AI message (fallback)
      if (commands.length === 0 && response.message) {
        commands = aiWorkspaceSlotProcessor.parseAIResponse(response.message);
      }

      // Execute commands if any
      let executionResult = null;
      if (commands.length > 0) {
        executionResult = executeSlotCommands(commands);
        setCommandStatus(executionResult.success ? 'success' : 'error');

        // Auto-clear status after 3 seconds
        setTimeout(() => setCommandStatus(null), 3000);
      }

      // Add AI response to chat
      addChatMessage({
        role: 'assistant',
        content: response.message || 'Processing complete.',
        slotCommand: commands.length > 0 ? commands : null,
        executionResult,
        data: response.data
      });

    } catch (error) {
      console.error('AI processing error:', error);
      setCommandStatus('error');

      // Fallback to local processing if backend fails
      const localCommands = aiWorkspaceSlotProcessor.parseAIResponse(userMessage);

      if (localCommands.length > 0) {
        const result = executeSlotCommands(localCommands);
        addChatMessage({
          role: 'assistant',
          content: result.success
            ? `Applied ${result.executed} change(s) based on your request.`
            : `Could not apply changes: ${result.errors.join(', ')}`,
          slotCommand: localCommands,
          executionResult: result,
          error: !result.success
        });
      } else {
        addChatMessage({
          role: 'assistant',
          content: error.message || 'Sorry, I encountered an error processing your request. Please try again.',
          error: true
        });
      }
    } finally {
      setIsProcessingAi(false);
    }
  };

  // Handle Enter key to send
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Quick action suggestions
  const quickActions = [
    { label: 'Add banner', prompt: 'Add a promotional banner at the top' },
    { label: 'Change layout', prompt: 'Change the layout to 2 columns' },
    { label: 'Add section', prompt: 'Add a new section below the main content' },
    { label: 'Create plugin', prompt: 'Create a plugin that...' }
  ];

  // Handle confirmation action from message
  const handleConfirmAction = async (message) => {
    if (message.confirmAction?.type === 'generate-plugin') {
      // Remove confirmAction from message
      message.confirmAction = null;
      await handleGeneratePlugin(message.confirmAction?.prompt || inputValue);
    } else if (message.confirmAction?.type === 'create-plugin') {
      message.confirmAction = null;
      await handleInstallPlugin(message.confirmAction?.pluginData);
    }
  };

  const handleCancelConfirmation = () => {
    addChatMessage({
      role: 'assistant',
      content: '❌ Cancelled. What else can I help you with?'
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Panel Header */}
      <div className="px-4 py-3 h-12 border-b bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-500" />
          <span className="font-medium text-sm">AI Assistant</span>
        </div>
        <div className="flex items-center gap-1">
          {lastAiOperation && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={undoLastAiOperation}
              title="Undo last AI change"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          )}
          {chatMessages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={clearChatHistory}
              title="Clear chat"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Chat Messages */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 px-4">
        <div className="py-4 space-y-4">
          {chatMessages.length === 0 ? (
            // Empty state with suggestions
            <div className="text-center py-8">
              <Bot className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                AI Layout & Plugin Assistant
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 max-w-[200px] mx-auto">
                Edit {selectedPageType} page layout or create plugins
              </p>

              {/* Quick action buttons */}
              <div className="flex flex-wrap gap-2 justify-center mb-6">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => setInputValue(action.prompt)}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>

              {/* Starter templates */}
              {starterTemplates.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Or start with a template:
                  </p>
                  <div className="space-y-2">
                    {starterTemplates.slice(0, 3).map((template) => (
                      <button
                        key={template.id}
                        onClick={() => handleCloneTemplate(template)}
                        className="w-full flex items-center gap-2 p-2 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors text-left"
                      >
                        <span className="text-lg">{template.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-xs text-gray-900 truncate">{template.name}</div>
                          <div className="text-xs text-gray-500 truncate">{template.description}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Chat messages
            chatMessages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-3',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'assistant' && (
                  <div className="shrink-0 w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                )}

                <div className="max-w-[85%] flex flex-col gap-2">
                  <div
                    className={cn(
                      'rounded-lg px-3 py-2 text-sm',
                      message.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : message.error
                          ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                    )}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>

                    {/* Credits Used */}
                    {message.credits && message.role !== 'user' && (
                      <p className="text-xs mt-2 opacity-70">
                        {message.credits} credits used
                      </p>
                    )}

                    {/* Confirmation Actions */}
                    {message.confirmAction && message.role !== 'user' && (
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={async () => {
                            const action = message.confirmAction;
                            message.confirmAction = null;
                            if (action.type === 'generate-plugin') {
                              await handleGeneratePlugin(action.prompt);
                            } else if (action.type === 'create-plugin') {
                              await handleInstallPlugin(action.pluginData);
                            }
                          }}
                          className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded-md font-medium"
                        >
                          ✓ Yes, Proceed
                        </button>
                        <button
                          onClick={handleCancelConfirmation}
                          className="flex items-center gap-2 px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs rounded-md font-medium"
                        >
                          ✗ Cancel
                        </button>
                      </div>
                    )}

                    {/* Slot command execution result */}
                    {message.executionResult && (
                      <div className={cn(
                        'mt-2 pt-2 border-t flex items-center gap-2 text-xs',
                        message.executionResult.success
                          ? 'border-green-200 dark:border-green-800 text-green-600 dark:text-green-400'
                          : 'border-red-200 dark:border-red-800 text-red-600 dark:text-red-400'
                      )}>
                        {message.executionResult.success ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Applied {message.executionResult.executed} change(s)</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-3.5 w-3.5" />
                            <span>{message.executionResult.errors?.[0] || 'Failed to apply changes'}</span>
                          </>
                        )}
                      </div>
                    )}

                    {/* Slot command preview (when AI returns a command) */}
                    {message.slotCommand && !message.executionResult && (
                      <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                        <p className="text-xs font-medium mb-1">Proposed change:</p>
                        <pre className="text-xs bg-gray-200 dark:bg-gray-800 rounded p-2 overflow-x-auto max-h-32">
                          {JSON.stringify(message.slotCommand, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>

                  {/* Generated Plugin Preview */}
                  {message.data?.type === 'plugin' && message.role !== 'user' && (
                    <PluginPreview
                      plugin={message.data.plugin}
                      onInstall={handleInstallPlugin}
                      onOpenEditor={openPluginEditor}
                    />
                  )}
                </div>

                {message.role === 'user' && (
                  <div className="shrink-0 w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                )}
              </div>
            ))
          )}

          {/* Loading indicator */}
          {isProcessingAi && (
            <div className="flex gap-3">
              <div className="shrink-0 w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Bot className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2">
                <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
              </div>
            </div>
          )}

          {/* Cloning indicator */}
          {cloningTemplate && (
            <div className="flex gap-3">
              <div className="shrink-0 w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Package className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Cloning template...</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 border-t bg-white dark:bg-gray-800 shrink-0">
        <div className="flex gap-2">
          <Textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Describe changes for ${selectedPageType} page...`}
            className="min-h-[60px] max-h-[120px] resize-none text-sm"
            disabled={isProcessingAi}
          />
          <Button
            onClick={handleSend}
            disabled={!inputValue.trim() || isProcessingAi}
            size="sm"
            className="h-[60px] w-10 shrink-0"
          >
            {isProcessingAi ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-[10px] text-gray-400 mt-2 text-center">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>

      {/* Clone Template Modal */}
      {showCloneModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-4 w-80">
            <h3 className="text-sm font-semibold mb-3">Clone Template Plugin</h3>

            <div className="space-y-3">
              <div className="p-2 bg-purple-50 border border-purple-200 rounded flex items-center gap-2">
                <span className="text-lg">{templateToClone?.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-xs truncate">{templateToClone?.name}</div>
                  <div className="text-xs text-gray-500 truncate">{templateToClone?.description}</div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  New Plugin Name
                </label>
                <Input
                  value={cloneName}
                  onChange={(e) => setCloneName(e.target.value)}
                  placeholder="Enter plugin name"
                  className="text-sm"
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
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button
                onClick={confirmCloneTemplate}
                disabled={!cloneName.trim()}
                size="sm"
                className="flex-1"
              >
                Clone
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowCloneModal(false);
                  setTemplateToClone(null);
                  setCloneName('');
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * PluginPreview - Renders a preview card for generated plugins
 */
const PluginPreview = ({ plugin, onInstall, onOpenEditor }) => {
  const [showCode, setShowCode] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      await onInstall(plugin);
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
      <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center gap-2 mb-1">
          <Package className="w-4 h-4 text-blue-600" />
          <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
            {plugin.name}
          </h3>
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          {plugin.description}
        </p>
      </div>

      {/* Plugin Actions */}
      <div className="p-2 flex items-center justify-between bg-white dark:bg-gray-800">
        <button
          onClick={() => setShowCode(!showCode)}
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
        >
          {showCode ? <Eye className="w-3 h-3" /> : <Code className="w-3 h-3" />}
          {showCode ? 'Hide' : 'View'} Code
        </button>
        <button
          onClick={handleInstall}
          disabled={isInstalling}
          className="flex items-center gap-1 px-2 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white text-xs rounded-md"
        >
          <Download className="w-3 h-3" />
          {isInstalling ? 'Creating...' : 'Create Plugin'}
        </button>
      </div>

      {/* Code View */}
      {showCode && plugin.generatedFiles && (
        <div className="border-t border-gray-200 dark:border-gray-700 max-h-48 overflow-auto">
          {plugin.generatedFiles.map((file, idx) => (
            <div key={idx}>
              <div className="px-2 py-1 bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <span className="text-xs font-mono text-gray-700 dark:text-gray-300">
                  {file.name}
                </span>
              </div>
              <pre className="p-2 bg-gray-900 text-gray-100 text-xs overflow-x-auto">
                <code>{file.code?.substring(0, 500)}{file.code?.length > 500 ? '...' : ''}</code>
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WorkspaceAIPanel;
