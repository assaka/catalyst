import React, { useState, useRef, useEffect } from 'react';
import { useAIWorkspace } from '@/contexts/AIWorkspaceContext';
import { useStoreSelection } from '@/contexts/StoreSelectionContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Send,
  Loader2,
  Bot,
  User,
  Sparkles,
  Trash2,
  RotateCcw,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import aiWorkspaceSlotProcessor from '@/services/aiWorkspaceSlotProcessor';
import apiClient from '@/api/client';

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
    slotHandlers
  } = useAIWorkspace();

  const { getSelectedStoreId } = useStoreSelection();
  const [inputValue, setInputValue] = useState('');
  const [commandStatus, setCommandStatus] = useState(null); // 'success', 'error', null
  const scrollAreaRef = useRef(null);
  const inputRef = useRef(null);

  // Get storeId from context
  const storeId = getSelectedStoreId();

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

  // Handle sending a message
  const handleSend = async () => {
    if (!inputValue.trim() || isProcessingAi) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setCommandStatus(null);

    // Add user message to chat
    addChatMessage({
      role: 'user',
      content: userMessage
    });

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
          'Resize slots', 'Move slots', 'Reorder slots'
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
        executionResult
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
    { label: 'Style update', prompt: 'Make the buttons larger and more prominent' }
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Panel Header */}
      <div className="px-4 py-3 border-b bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between shrink-0">
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
                AI Layout Assistant
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 max-w-[200px] mx-auto">
                Describe changes you want to make to the {selectedPageType} page layout
              </p>

              {/* Quick action buttons */}
              <div className="flex flex-wrap gap-2 justify-center">
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

                <div
                  className={cn(
                    'max-w-[85%] rounded-lg px-3 py-2 text-sm',
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : message.error
                        ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                  )}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>

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
    </div>
  );
};

export default WorkspaceAIPanel;
