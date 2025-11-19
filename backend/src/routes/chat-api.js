/**
 * Chat API Routes
 * Handles customer service chat conversations and messages
 */

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
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
    const connection = await ConnectionManager.getConnection(storeId);
    const sequelize = connection.sequelize;

    const result = await sequelize.query(`
      INSERT INTO chat_conversations (
        id, store_id, customer_id, customer_name, customer_email, status, started_at, created_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, 'open', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      ) RETURNING *
    `, {
      bind: [storeId, customer_id || null, customer_name || 'Guest', customer_email || ''],
      type: sequelize.QueryTypes.INSERT
    });

    const conversation = result[0][0];

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
    const connection = await ConnectionManager.getConnection(storeId);
    const sequelize = connection.sequelize;

    const messages = await sequelize.query(`
      SELECT m.* FROM chat_messages m
      JOIN chat_conversations c ON m.conversation_id = c.id
      WHERE m.conversation_id = $1 AND c.store_id = $2
      ORDER BY m.created_at ASC
    `, {
      bind: [id, storeId],
      type: sequelize.QueryTypes.SELECT
    });

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
    const connection = await ConnectionManager.getConnection(storeId);
    const sequelize = connection.sequelize;

    // Verify conversation belongs to this store
    const conversationCheck = await sequelize.query(`
      SELECT id FROM chat_conversations WHERE id = $1 AND store_id = $2
    `, {
      bind: [id, storeId],
      type: sequelize.QueryTypes.SELECT
    });

    if (!conversationCheck || conversationCheck.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found or access denied'
      });
    }

    // Insert message
    const result = await sequelize.query(`
      INSERT INTO chat_messages (
        id, conversation_id, message_text, sender_type, sender_id, sender_name, created_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, CURRENT_TIMESTAMP
      ) RETURNING *
    `, {
      bind: [
        id,
        message_text,
        sender_type || 'customer',
        sender_id || null,
        sender_name || null
      ],
      type: sequelize.QueryTypes.INSERT
    });

    const message = result[0][0];

    // Update conversation last_message_at
    await sequelize.query(`
      UPDATE chat_conversations
      SET last_message_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND store_id = $2
    `, {
      bind: [id, storeId],
      type: sequelize.QueryTypes.UPDATE
    });

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
    const connection = await ConnectionManager.getConnection(storeId);
    const sequelize = connection.sequelize;

    let query = 'SELECT * FROM chat_conversations WHERE store_id = $1';
    const params = [storeId];

    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }

    query += ` ORDER BY last_message_at DESC NULLS LAST, created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const conversations = await sequelize.query(query, {
      bind: params,
      type: sequelize.QueryTypes.SELECT
    });

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
    const connection = await ConnectionManager.getConnection(storeId);
    const sequelize = connection.sequelize;

    await sequelize.query(`
      UPDATE chat_conversations
      SET assigned_agent_id = $1,
          status = 'assigned',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND store_id = $3
    `, {
      bind: [agent_id, id, storeId],
      type: sequelize.QueryTypes.UPDATE
    });

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
    const connection = await ConnectionManager.getConnection(storeId);
    const sequelize = connection.sequelize;

    await sequelize.query(`
      UPDATE chat_conversations
      SET status = 'closed',
          closed_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND store_id = $2
    `, {
      bind: [id, storeId],
      type: sequelize.QueryTypes.UPDATE
    });

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
