/**
 * Add Chat Support admin page to database as part of customer-service-chat plugin
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    require: true,
    rejectUnauthorized: false
  } : false
});

const chatSupportComponent = `import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Send, X, User, Clock } from 'lucide-react';
import { useAlertTypes } from '@/hooks/useAlert';

export default function ChatSupport() {
  const { showError, showSuccess, AlertComponent } = useAlertTypes();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const messagesEndRef = useRef(null);
  const previousMessageCount = useRef({});

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        setNotificationsEnabled(permission === 'granted');
      });
    } else if ('Notification' in window && Notification.permission === 'granted') {
      setNotificationsEnabled(true);
    }
  }, []);

  // Show desktop notification
  const showNotification = (conversation, message) => {
    if (notificationsEnabled && document.hidden) {
      const notification = new Notification('New Chat Message', {
        body: \`\${conversation.customer_name || 'Guest'}: \${message.message_text.substring(0, 50)}...\`,
        icon: '/favicon.ico',
        tag: conversation.id
      });

      notification.onclick = () => {
        window.focus();
        selectConversation(conversation);
        notification.close();
      };
    }
  };

  // Load conversations
  const loadConversations = async () => {
    try {
      const response = await fetch('/api/chat/conversations?limit=50');
      const data = await response.json();

      if (data.success) {
        setConversations(data.conversations);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      showError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  // Load messages for selected conversation
  const loadMessages = async (conversationId, isPolling = false) => {
    try {
      const response = await fetch(\`/api/chat/conversations/\${conversationId}/messages\`);
      const data = await response.json();

      if (data.success) {
        // Check for new customer messages
        if (isPolling && previousMessageCount.current[conversationId]) {
          const previousCount = previousMessageCount.current[conversationId];
          const newMessages = data.messages.slice(previousCount);

          // Notify about new customer messages
          newMessages.forEach(msg => {
            if (msg.sender_type === 'customer') {
              const conversation = conversations.find(c => c.id === conversationId);
              if (conversation) {
                showNotification(conversation, msg);
              }
            }
          });
        }

        previousMessageCount.current[conversationId] = data.messages.length;
        setMessages(data.messages);
        setTimeout(scrollToBottom, 100);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      showError('Failed to load messages');
    }
  };

  // Send message as agent
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      setSending(true);
      const response = await fetch(\`/api/chat/conversations/\${selectedConversation.id}/messages\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message_text: newMessage,
          sender_type: 'agent',
          sender_name: 'Support Agent'
        })
      });

      const data = await response.json();

      if (data.success) {
        setNewMessage('');
        setMessages([...messages, data.message]);
        setTimeout(scrollToBottom, 100);
        loadConversations();
      } else {
        showError('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      showError('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // Handle conversation selection
  const selectConversation = (conversation) => {
    setSelectedConversation(conversation);
    loadMessages(conversation.id);
  };

  // Assign conversation to current agent
  const assignToMe = async (conversationId) => {
    try {
      const response = await fetch(\`/api/chat/conversations/\${conversationId}/assign\`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: 'current-agent'
        })
      });

      const data = await response.json();

      if (data.success) {
        showSuccess('Conversation assigned to you');
        loadConversations();
        if (selectedConversation?.id === conversationId) {
          const updatedConversation = { ...selectedConversation, status: 'assigned' };
          setSelectedConversation(updatedConversation);
        }
      }
    } catch (error) {
      console.error('Error assigning conversation:', error);
      showError('Failed to assign conversation');
    }
  };

  // Close conversation
  const closeConversation = async (conversationId) => {
    try {
      const response = await fetch(\`/api/chat/conversations/\${conversationId}/close\`, {
        method: 'PATCH'
      });

      const data = await response.json();

      if (data.success) {
        showSuccess('Conversation closed');
        loadConversations();
        if (selectedConversation?.id === conversationId) {
          setSelectedConversation(null);
          setMessages([]);
        }
      }
    } catch (error) {
      console.error('Error closing conversation:', error);
      showError('Failed to close conversation');
    }
  };

  // Initial load
  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 10000);
    return () => clearInterval(interval);
  }, []);

  // Poll for new messages in selected conversation
  useEffect(() => {
    if (!selectedConversation) return;

    const interval = setInterval(() => {
      loadMessages(selectedConversation.id, true);
    }, 3000);

    return () => clearInterval(interval);
  }, [selectedConversation, conversations]);

  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return \`\${diffMins}m ago\`;
    if (diffMins < 1440) return \`\${Math.floor(diffMins / 60)}h ago\`;
    return date.toLocaleDateString();
  };

  const formatMessageTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const colors = {
      open: 'bg-green-100 text-green-800',
      assigned: 'bg-blue-100 text-blue-800',
      resolved: 'bg-gray-100 text-gray-800',
      closed: 'bg-gray-100 text-gray-600'
    };

    return (
      <Badge className={colors[status] || colors.open}>
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400 animate-pulse" />
          <p className="text-gray-500">Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AlertComponent />

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Chat Support</h1>
          <p className="text-gray-600">Manage customer conversations</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {conversations.filter(c => c.status === 'open').length} open
          </Badge>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="grid grid-cols-3 gap-6 h-[calc(100vh-16rem)]">
        {/* Conversations List */}
        <Card className="col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Conversations
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-22rem)]">
              {conversations.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">No conversations yet</p>
                </div>
              ) : (
                <div className="divide-y">
                  {conversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      onClick={() => selectConversation(conversation)}
                      className={\`p-4 cursor-pointer transition-colors hover:bg-gray-50 \${
                        selectedConversation?.id === conversation.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                      }\`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">
                            {conversation.customer_name || 'Guest'}
                          </span>
                        </div>
                        {getStatusBadge(conversation.status)}
                      </div>
                      {conversation.customer_email && (
                        <p className="text-sm text-gray-500 mb-1">{conversation.customer_email}</p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Clock className="h-3 w-3" />
                        {formatTime(conversation.last_message_at || conversation.created_at)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Messages View */}
        <Card className="col-span-2">
          {!selectedConversation ? (
            <CardContent className="flex items-center justify-center h-full">
              <div className="text-center">
                <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500 text-lg">Select a conversation to view messages</p>
              </div>
            </CardContent>
          ) : (
            <>
              {/* Conversation Header */}
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      {selectedConversation.customer_name || 'Guest'}
                    </CardTitle>
                    {selectedConversation.customer_email && (
                      <p className="text-sm text-gray-500 mt-1">{selectedConversation.customer_email}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(selectedConversation.status)}
                    {selectedConversation.status === 'open' && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => assignToMe(selectedConversation.id)}
                      >
                        <User className="h-4 w-4 mr-1" />
                        Assign to Me
                      </Button>
                    )}
                    {selectedConversation.status !== 'closed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => closeConversation(selectedConversation.id)}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Close
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent className="p-0">
                <ScrollArea className="h-[calc(100vh-32rem)] p-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-500">No messages yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={\`flex \${message.sender_type === 'agent' ? 'justify-end' : 'justify-start'}\`}
                        >
                          <div
                            className={\`max-w-[70%] rounded-lg p-3 \${
                              message.sender_type === 'agent'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }\`}
                          >
                            {message.sender_type === 'agent' && message.sender_name && (
                              <p className="text-xs font-semibold mb-1 opacity-90">
                                {message.sender_name}
                              </p>
                            )}
                            <p className="whitespace-pre-wrap">{message.message_text}</p>
                            <p
                              className={\`text-xs mt-1 \${
                                message.sender_type === 'agent' ? 'text-blue-100' : 'text-gray-500'
                              }\`}
                            >
                              {formatMessageTime(message.created_at)}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>

                {/* Message Input */}
                {selectedConversation.status !== 'closed' && (
                  <div className="border-t p-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                        disabled={sending}
                        className="flex-1"
                      />
                      <Button
                        onClick={sendMessage}
                        disabled={sending || !newMessage.trim()}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}`;

async function addChatAdminPage() {
  const client = await pool.connect();

  try {
    console.log('📋 Adding Chat Support admin page to database...\\n');

    // 1. Use plugin string ID (matches plugin_scripts.plugin_id format)
    const pluginId = 'customer-service-chat';
    console.log('✅ Using plugin_id:', pluginId);

    // 2. Add admin page component to plugin_admin_pages table
    await client.query(`
      INSERT INTO plugin_admin_pages (
        plugin_id,
        page_key,
        page_name,
        route,
        component_code,
        description,
        icon,
        category,
        order_position,
        is_enabled
      ) VALUES (
        $1,
        'chat-support',
        'Chat Support',
        '/admin/chat-support',
        $2,
        'Manage customer service conversations and live chat',
        'MessageSquare',
        'main',
        5,
        true
      )
      ON CONFLICT (plugin_id, page_key) DO UPDATE SET
        component_code = EXCLUDED.component_code,
        page_name = EXCLUDED.page_name,
        route = EXCLUDED.route,
        description = EXCLUDED.description,
        icon = EXCLUDED.icon,
        category = EXCLUDED.category,
        order_position = EXCLUDED.order_position,
        updated_at = NOW()
    `, [pluginId, chatSupportComponent]);

    console.log('✅ Added ChatSupport admin page component to plugin_admin_pages');

    // 3. Register navigation item in admin_navigation_registry
    // Note: Setting plugin_id to NULL because admin_navigation_registry expects UUID
    // but our plugin system uses VARCHAR IDs like 'customer-service-chat'
    await client.query(`
      INSERT INTO admin_navigation_registry (
        key,
        label,
        icon,
        route,
        order_position,
        is_core,
        plugin_id,
        category,
        is_visible
      ) VALUES (
        'chat-support',
        'Chat Support',
        'MessageSquare',
        '/admin/chat-support',
        5,
        false,
        NULL,
        'main',
        true
      )
      ON CONFLICT (key) DO UPDATE SET
        label = EXCLUDED.label,
        icon = EXCLUDED.icon,
        route = EXCLUDED.route,
        updated_at = NOW()
    `);

    console.log('✅ Registered Chat Support in admin navigation registry');

    console.log('\\n🎉 Done! The Chat Support admin page is now 100% database-driven.');
    console.log('\\nℹ️  The page will appear in the admin menu when the plugin is installed and active.');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addChatAdminPage()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\\n❌ Fatal error:', error);
    process.exit(1);
  });
