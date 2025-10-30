// Add CRUD System Guide to RAG system
require('dotenv').config();
const { sequelize } = require('./src/database/connection');
const fs = require('fs');
const path = require('path');

async function addCRUDGuideToRAG() {
  try {
    console.log('📚 Adding CRUD System Guide to RAG system...\n');

    // Read the CRUD guide markdown file
    const guidePath = path.join(__dirname, '..', 'CRUD_SYSTEM_GUIDE.md');
    const guideContent = fs.readFileSync(guidePath, 'utf-8');

    const document = {
      title: 'Complete CRUD System Guide - 100% Database-Driven',
      type: 'guide',
      category: 'plugin-development',
      mode: 'developer',
      priority: 95,  // High priority - fundamental concept
      content: guideContent,
      tags: [
        'crud',
        'plugin-development',
        'database-driven',
        'controllers',
        'entities',
        'admin-pages',
        'event-listeners',
        'email-capture',
        'tutorial',
        'best-practices',
        'troubleshooting'
      ]
    };

    // Check if document exists
    const existing = await sequelize.query(`
      SELECT id FROM ai_context_documents
      WHERE title = $1
    `, {
      bind: [document.title],
      type: sequelize.QueryTypes.SELECT
    });

    if (existing.length > 0) {
      console.log('⚠️  Document already exists, updating...');
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
      console.log('✅ Updated existing document');
    } else {
      console.log('📝 Creating new document...');
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
      console.log('✅ Created new document');
    }

    console.log('\n📋 Document Details:');
    console.log(`   Title: ${document.title}`);
    console.log(`   Type: ${document.type}`);
    console.log(`   Category: ${document.category}`);
    console.log(`   Mode: ${document.mode}`);
    console.log(`   Priority: ${document.priority}`);
    console.log(`   Tags: ${document.tags.join(', ')}`);
    console.log(`   Content: ${document.content.length} characters`);

    console.log('\n✅ CRUD Guide added to RAG system!');
    console.log('   🤖 AI can now reference this when helping with:');
    console.log('      • Building CRUD systems');
    console.log('      • Creating entities and controllers');
    console.log('      • Debugging controller issues');
    console.log('      • Understanding database-driven architecture');
    console.log('      • Email capture examples');

    console.log('\n🎓 Keywords AI will match:');
    console.log('   ', document.tags.join(', '));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

addCRUDGuideToRAG();
