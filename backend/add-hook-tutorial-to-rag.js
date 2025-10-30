// Add hook tutorial to RAG system
require('dotenv').config();
const { sequelize } = require('./src/database/connection');
const fs = require('fs');
const path = require('path');

async function addTutorialToRAG() {
  try {
    console.log('📚 Adding hook tutorial to RAG system...\n');

    // Read the tutorial file
    const tutorialPath = path.join(__dirname, '..', 'PLUGIN_HOOKS_TUTORIAL.md');
    const content = fs.readFileSync(tutorialPath, 'utf8');

    const document = {
      title: 'Plugin Hooks & Events Tutorial - Empty Cart Coupon Example',
      type: 'tutorial',
      category: 'plugins',
      mode: 'developer',
      priority: 90,
      content: content,
      tags: ['hooks', 'events', 'tutorial', 'coupon', 'empty-cart', 'auto-apply', 'beginner', 'database-driven']
    };

    // Check if exists
    const existing = await sequelize.query(`
      SELECT id FROM ai_context_documents
      WHERE title = $1
    `, {
      bind: [document.title],
      type: sequelize.QueryTypes.SELECT
    });

    if (existing.length > 0) {
      await sequelize.query(`
        UPDATE ai_context_documents
        SET content = $1, type = $2, category = $3, mode = $4, priority = $5,
            tags = $6, updated_at = NOW()
        WHERE title = $7
      `, {
        bind: [
          document.content,
          document.type,
          document.category,
          document.mode,
          document.priority,
          JSON.stringify(document.tags),
          document.title
        ],
        type: sequelize.QueryTypes.UPDATE
      });
      console.log('✅ Updated existing tutorial');
    } else {
      await sequelize.query(`
        INSERT INTO ai_context_documents
        (title, type, category, mode, priority, content, tags, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW(), NOW())
      `, {
        bind: [
          document.title,
          document.type,
          document.category,
          document.mode,
          document.priority,
          document.content,
          JSON.stringify(document.tags)
        ],
        type: sequelize.QueryTypes.INSERT
      });
      console.log('✅ Created new tutorial');
    }

    console.log('\n📋 Tutorial Details:');
    console.log(`   Title: ${document.title}`);
    console.log(`   Type: ${document.type}`);
    console.log(`   Priority: ${document.priority}`);
    console.log(`   Content: ${document.content.length} characters`);
    console.log(`   Tags: ${document.tags.join(', ')}`);

    console.log('\n✅ Tutorial added to RAG system!');
    console.log('   AI can now teach users how to create hooks and events.');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

addTutorialToRAG();
