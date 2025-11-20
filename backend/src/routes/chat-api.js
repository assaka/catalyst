/**
 * Chat API Routes
 * Handles customer service chat conversations and messages
 */

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { storeResolver } = require('../middleware/storeResolver');
const ConnectionManager = require('../services/database/ConnectionManager');

// All routes require authentication and automatic store resolution (optional for public chat)
router.use(authMiddleware);
router.use(storeResolver({ required: false }));

/**
 * POST /api/chat/conversations
 * Create a new chat conversation
 */
router.post('/conversations', async (req, res) => {
  try {
    const { storeId } = req;
    const { customer_name, customer_email, customer_id } = req.body;

    console.log('💬 Creating new conversation for:', customer_name || 'Guest');

    // Get tenant connection
    const tenantDb = await ConnectionManager.getStoreConnection(storeId);

    const { data: conversations, error } = await tenantDb
      .from('chat_conversations')
      .insert({
        store_id: storeId,
        customer_id: customer_id || null,
        customer_name: customer_name || 'Guest',
        customer_email: customer_email || '',
        status: 'open',
        started_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      })
      .select();

    if (error) throw error;
    const conversation = conversations[0];

    console.log('✅ Conversation created:', conversation.id);

    res.json({
      success: true,
      conversation: conversation
    });
  } catch (error) {
    console.error('❌ Error creating conversation:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/chat/conversations/:id/messages
 * Get all messages for a conversation
 */
router.get('/conversations/:id/messages', async (req, res) => {
  try {
    const { storeId } = req;
    const { id } = req.params;

    // Get tenant connection
    const tenantDb = await ConnectionManager.getStoreConnection(storeId);

    const { data: messages, error } = await tenantDb
      .from('chat_messages')
      .select('chat_messages.*')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      messages: messages
    });
  } catch (error) {
    console.error('❌ Error getting messages:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/chat/conversations/:id/messages
 * Send a message in a conversation
 */
router.post('/conversations/:id/messages', async (req, res) => {
  try {
    const { storeId } = req;
    const { id } = req.params;
    const { message_text, sender_type, sender_id, sender_name } = req.body;

    console.log(`💬 New message in conversation ${id}:`, message_text.substring(0, 50));

    // Get tenant connection
    const tenantDb = await ConnectionManager.getStoreConnection(storeId);

    // Verify conversation belongs to this store
    const { data: conversationCheck, error: checkError } = await tenantDb
      .from('chat_conversations')
      .select('id')
      .eq('id', id)
      .eq('store_id', storeId)
      .single();

    if (checkError || !conversationCheck) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found or access denied'
      });
    }

    // Insert message
    const { data: messages, error: insertError } = await tenantDb
      .from('chat_messages')
      .insert({
        conversation_id: id,
        message_text: message_text,
        sender_type: sender_type || 'customer',
        sender_id: sender_id || null,
        sender_name: sender_name || null,
        created_at: new Date().toISOString()
      })
      .select();

    if (insertError) throw insertError;
    const message = messages[0];

    // Update conversation last_message_at
    const { error: updateError } = await tenantDb
      .from('chat_conversations')
      .update({
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('store_id', storeId);

    if (updateError) throw updateError;

    console.log('✅ Message sent');

    res.json({
      success: true,
      message: message
    });
  } catch (error) {
    console.error('❌ Error sending message:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/chat/conversations
 * Get all conversations (for admin dashboard)
 */
router.get('/conversations', async (req, res) => {
  try {
    const { storeId } = req;
    const { status, limit = 50 } = req.query;

    // Get tenant connection
    const tenantDb = await ConnectionManager.getStoreConnection(storeId);

    let query = tenantDb
      .from('chat_conversations')
      .select('*')
      .eq('store_id', storeId);

    if (status) {
      query = query.eq('status', status);
    }

    query = query
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    const { data: conversations, error } = await query;
    if (error) throw error;

    res.json({
      success: true,
      conversations: conversations
    });
  } catch (error) {
    console.error('❌ Error getting conversations:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PATCH /api/chat/conversations/:id/assign
 * Assign conversation to an agent
 */
router.patch('/conversations/:id/assign', async (req, res) => {
  try {
    const { storeId } = req;
    const { id } = req.params;
    const { agent_id } = req.body;

    // Get tenant connection
    const tenantDb = await ConnectionManager.getStoreConnection(storeId);

    const { error } = await tenantDb
      .from('chat_conversations')
      .update({
        assigned_agent_id: agent_id,
        status: 'assigned',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('store_id', storeId);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Conversation assigned'
    });
  } catch (error) {
    console.error('❌ Error assigning conversation:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PATCH /api/chat/conversations/:id/close
 * Close a conversation
 */
router.patch('/conversations/:id/close', async (req, res) => {
  try {
    const { storeId } = req;
    const { id } = req.params;

    // Get tenant connection
    const tenantDb = await ConnectionManager.getStoreConnection(storeId);

    const { error } = await tenantDb
      .from('chat_conversations')
      .update({
        status: 'closed',
        closed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('store_id', storeId);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Conversation closed'
    });
  } catch (error) {
    console.error('❌ Error closing conversation:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
