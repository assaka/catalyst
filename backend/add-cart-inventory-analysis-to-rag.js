// Add Cart & Inventory System Analysis to RAG system
require('dotenv').config();
const { sequelize } = require('./src/database/connection');
const fs = require('fs');
const path = require('path');

async function addCartInventoryAnalysisToRAG() {
  try {
    console.log('📚 Adding Cart & Inventory System Analysis to RAG system...\n');

    // Read the analysis markdown file
    const analysisPath = path.join(__dirname, '..', 'CART_INVENTORY_SYSTEM_ANALYSIS.md');
    const analysisContent = fs.readFileSync(analysisPath, 'utf-8');

    const document = {
      title: 'Cart & Inventory System - Complete Analysis',
      type: 'documentation',
      category: 'cart-inventory',
      mode: 'developer',
      priority: 95,  // High priority - core system
      content: analysisContent,
      tags: [
        'cart',
        'inventory',
        'stock',
        'out-of-stock',
        'add-to-cart',
        'stock-validation',
        'cart-service',
        'product-card',
        'stock-labels',
        'backorders',
        'hooks',
        'events',
        'cart-management',
        'stock-management',
        'e-commerce',
        'validation',
        'frontend',
        'backend',
        'api',
        'architecture'
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

    console.log('\n✅ Cart & Inventory Analysis added to RAG system!');
    console.log('   🤖 AI can now reference this when helping with:');
    console.log('      • Understanding cart system architecture');
    console.log('      • Implementing stock validation');
    console.log('      • Debugging cart and inventory issues');
    console.log('      • Adding out-of-stock features');
    console.log('      • Understanding hooks and events');
    console.log('      • Stock label configuration');
    console.log('      • Cart session management');

    console.log('\n🎓 Keywords AI will match:');
    console.log('   ', document.tags.join(', '));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

addCartInventoryAnalysisToRAG();
