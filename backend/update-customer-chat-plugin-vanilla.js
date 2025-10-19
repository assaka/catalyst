/**
 * Update Customer Service Chat Plugin - Vanilla JavaScript Version
 * Replaces JSX components with vanilla JavaScript for direct execution
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

const PLUGIN_ID = 'customer-service-chat';

async function updateChatPlugin() {
  const client = await pool.connect();

  try {
    console.log('🔄 Updating Customer Service Chat Plugin to Vanilla JS...\n');

    // Delete existing scripts
    console.log('🗑️ Removing old JSX scripts...');
    await client.query('DELETE FROM plugin_scripts WHERE plugin_id = $1', [PLUGIN_ID]);

    // 1. Chat Widget - Vanilla JavaScript
    console.log('📄 Creating vanilla JS chat widget...');
    const chatWidgetCode = `
// Chat Widget - Vanilla JavaScript
export default class ChatWidget {
  constructor() {
    this.isOpen = false;
    this.conversationId = null;
    this.messages = [];
    this.widget = null;
  }

  // Initialize and inject widget into page
  init() {
    // Create widget container
    this.widget = document.createElement('div');
    this.widget.id = 'catalyst-chat-widget';
    this.widget.style.cssText = \`
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 9999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    \`;

    this.render();
    document.body.appendChild(this.widget);

    // Start polling for new messages
    setInterval(() => this.pollMessages(), 3000);
  }

  // Render widget HTML
  render() {
    if (!this.isOpen) {
      // Chat bubble button
      this.widget.innerHTML = \`
        <button id="chat-bubble" style="
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s;
        " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </button>
      \`;

      document.getElementById('chat-bubble').addEventListener('click', () => this.open());
    } else {
      // Chat window
      this.widget.innerHTML = \`
        <div style="
          width: 380px;
          height: 600px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.15);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        ">
          <!-- Header -->
          <div style="
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          ">
            <div>
              <div style="font-weight: 600; font-size: 16px;">Customer Support</div>
              <div style="font-size: 12px; opacity: 0.9;">We typically reply in minutes</div>
            </div>
            <button id="close-chat" style="
              background: rgba(255,255,255,0.2);
              border: none;
              color: white;
              width: 32px;
              height: 32px;
              border-radius: 50%;
              cursor: pointer;
              font-size: 20px;
              line-height: 1;
            ">×</button>
          </div>

          <!-- Messages -->
          <div id="chat-messages" style="
            flex: 1;
            overflow-y: auto;
            padding: 20px;
            background: #f5f5f5;
          ">
            \${this.renderMessages()}
          </div>

          <!-- Input -->
          <div style="
            padding: 16px;
            background: white;
            border-top: 1px solid #e0e0e0;
          ">
            <div style="display: flex; gap: 8px;">
              <input type="text" id="chat-input" placeholder="Type your message..." style="
                flex: 1;
                padding: 12px 16px;
                border: 1px solid #e0e0e0;
                border-radius: 24px;
                font-size: 14px;
                outline: none;
              ">
              <button id="send-message" style="
                width: 48px;
                height: 48px;
                border-radius: 50%;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border: none;
                color: white;
                cursor: pointer;
                font-size: 18px;
              ">➤</button>
            </div>
          </div>
        </div>
      \`;

      // Attach event listeners
      document.getElementById('close-chat').addEventListener('click', () => this.close());
      document.getElementById('send-message').addEventListener('click', () => this.sendMessage());
      document.getElementById('chat-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.sendMessage();
      });

      // Scroll to bottom
      const messagesDiv = document.getElementById('chat-messages');
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
  }

  // Render message list
  renderMessages() {
    if (this.messages.length === 0) {
      return '<div style="text-align: center; color: #999; margin-top: 40px;"><div style="font-size: 48px; margin-bottom: 16px;">👋</div><div>Hi! How can we help you today?</div></div>';
    }

    return this.messages.map(msg => {
      const isAgent = msg.sender_type === 'agent';
      const senderName = isAgent ? (msg.sender_name || 'Support Agent') : '';
      const senderHTML = isAgent ? '<div style="font-size: 11px; font-weight: 600; margin-bottom: 4px; opacity: 0.7;">' + senderName + '</div>' : '';
      const background = isAgent ? 'white' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      const color = isAgent ? '#333' : 'white';
      const justify = isAgent ? 'flex-start' : 'flex-end';

      return '<div style="display: flex; justify-content: ' + justify + '; margin-bottom: 12px;"><div style="max-width: 70%; padding: 12px 16px; border-radius: 16px; background: ' + background + '; color: ' + color + '; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">' + senderHTML + '<div>' + msg.message_text + '</div><div style="font-size: 10px; margin-top: 4px; opacity: 0.7;">' + this.formatTime(msg.created_at) + '</div></div></div>';
    }).join('');
  }

  // Format timestamp
  formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // Open chat
  async open() {
    this.isOpen = true;

    // Create conversation if needed
    if (!this.conversationId) {
      await this.createConversation();
    }

    this.render();
  }

  // Close chat
  close() {
    this.isOpen = false;
    this.render();
  }

  // Create new conversation
  async createConversation() {
    try {
      const response = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: 'Guest',
          customer_email: ''
        })
      });

      const data = await response.json();
      this.conversationId = data.conversation.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  }

  // Send message
  async sendMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();

    if (!message) return;

    // Add to UI immediately
    this.messages.push({
      message_text: message,
      sender_type: 'customer',
      created_at: new Date().toISOString()
    });

    input.value = '';
    this.render();

    // Send to server
    try {
      await fetch(\`/api/chat/conversations/\${this.conversationId}/messages\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message_text: message,
          sender_type: 'customer'
        })
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  // Poll for new messages
  async pollMessages() {
    if (!this.conversationId) return;

    try {
      const response = await fetch(\`/api/chat/conversations/\${this.conversationId}/messages\`);
      const data = await response.json();

      if (data.messages && data.messages.length > this.messages.length) {
        this.messages = data.messages;
        if (this.isOpen) {
          this.render();
        }
      }
    } catch (error) {
      console.error('Error polling messages:', error);
    }
  }
}

// Auto-initialize
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    const widget = new ChatWidget();
    widget.init();
  });
}
`;

    await client.query(`
      INSERT INTO plugin_scripts (
        plugin_id, file_name, file_content, script_type, scope, load_priority, is_enabled
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [PLUGIN_ID, 'components/ChatWidget.js', chatWidgetCode, 'js', 'frontend', 0, true]);

    console.log('✅ Chat widget created');

    // 2. Chat Service - Backend (no changes needed)
    console.log('📄 Creating chat service...');
    const chatServiceCode = `
export default class ChatService {
  constructor(db) {
    this.db = db;
  }

  async createConversation(customerData) {
    const { customer_name, customer_email, customer_id = null } = customerData;

    const result = await this.db.query(\`
      INSERT INTO chat_conversations (
        id, customer_id, customer_name, customer_email, status, started_at, created_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, 'open', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      ) RETURNING *
    \`, [customer_id, customer_name, customer_email]);

    return result.rows[0];
  }

  async sendMessage(conversationId, messageData) {
    const { message_text, sender_type, sender_id = null, sender_name = null } = messageData;

    const result = await this.db.query(\`
      INSERT INTO chat_messages (
        id, conversation_id, message_text, sender_type, sender_id, sender_name, created_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, CURRENT_TIMESTAMP
      ) RETURNING *
    \`, [conversationId, message_text, sender_type, sender_id, sender_name]);

    // Update conversation last_message_at
    await this.db.query(\`
      UPDATE chat_conversations
      SET last_message_at = CURRENT_TIMESTAMP,
          status = CASE WHEN status = 'open' THEN 'assigned' ELSE status END
      WHERE id = $1
    \`, [conversationId]);

    return result.rows[0];
  }

  async getConversationMessages(conversationId) {
    const result = await this.db.query(\`
      SELECT * FROM chat_messages
      WHERE conversation_id = $1
      ORDER BY created_at ASC
    \`, [conversationId]);

    return result.rows;
  }

  async getConversations(filter = {}) {
    const { status, agent_id, limit = 50 } = filter;

    let query = 'SELECT * FROM chat_conversations WHERE 1=1';
    const params = [];

    if (status) {
      params.push(status);
      query += \` AND status = $\${params.length}\`;
    }

    if (agent_id) {
      params.push(agent_id);
      query += \` AND assigned_agent_id = $\${params.length}\`;
    }

    query += \` ORDER BY last_message_at DESC NULLS LAST LIMIT $\${params.length + 1}\`;
    params.push(limit);

    const result = await this.db.query(query, params);
    return result.rows;
  }

  async assignConversation(conversationId, agentId) {
    const result = await this.db.query(\`
      UPDATE chat_conversations
      SET assigned_agent_id = $1, status = 'assigned'
      WHERE id = $2
      RETURNING *
    \`, [agentId, conversationId]);

    return result.rows[0];
  }

  async closeConversation(conversationId) {
    const result = await this.db.query(\`
      UPDATE chat_conversations
      SET status = 'closed', closed_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    \`, [conversationId]);

    return result.rows[0];
  }
}
`;

    await client.query(`
      INSERT INTO plugin_scripts (
        plugin_id, file_name, file_content, script_type, scope, load_priority, is_enabled
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [PLUGIN_ID, 'services/ChatService.js', chatServiceCode, 'js', 'backend', 1, true]);

    console.log('✅ Chat service created');

    console.log('\n' + '='.repeat(60));
    console.log('✅ Customer Service Chat Plugin Updated!');
    console.log('='.repeat(60));
    console.log('\n📊 Plugin now uses vanilla JavaScript (no JSX)');
    console.log('✅ Can be executed directly by PluginModuleLoader');

  } catch (error) {
    console.error('❌ Error updating chat plugin:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

updateChatPlugin()
  .then(() => {
    console.log('\n🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
