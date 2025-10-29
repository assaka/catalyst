// Create proper README for Cart Hamid plugin
require('dotenv').config();
const { sequelize } = require('./src/database/connection');

const PLUGIN_ID = 'eea24e22-7bc7-457e-8403-df53758ebf76';

const README_CONTENT = `# Cart Hamid Plugin

A comprehensive cart analytics plugin that tracks and analyzes cart page visits for e-commerce stores.

## Features

### 📊 Cart Visit Tracking
- Automatically tracks every visit to the cart page
- Captures user session data and cart metrics
- Records cart items count, subtotal, and total
- Stores user agent, IP address, and referrer information

### 🗄️ Database-Driven Architecture
- Uses \`hamid_cart\` entity table to store visit data
- Full schema management through AI Studio
- Supports ALTER TABLE migrations for schema updates
- Clean separation between code and data

### 🎮 API Endpoints
Three RESTful API endpoints for cart data:
- **POST** \`/api/plugins/cart-hamid/track-visit\` - Record cart visits
- **GET** \`/api/plugins/cart-hamid/visits\` - Retrieve visit history with pagination
- **GET** \`/api/plugins/cart-hamid/stats\` - Get analytics statistics

### 📈 Analytics Dashboard
- View total visits and unique users
- Track average cart items and totals
- Monitor cart abandonment patterns
- Real-time data refresh

### ⚡ Event Integration
- Listens to \`cart.viewed\` event
- Automatic tracking on every cart page load
- No manual instrumentation needed

## Installation

1. Activate the plugin in your plugin manager
2. Run the entity migration to create \`hamid_cart\` table
3. Cart visits will be tracked automatically

## Database Schema

### Entity: HamidCart
**Table:** \`hamid_cart\`

**Columns:**
- \`id\` - UUID primary key
- \`user_id\` - Reference to authenticated user (nullable)
- \`session_id\` - Session identifier for anonymous users
- \`cart_items_count\` - Number of items in cart
- \`cart_subtotal\` - Cart subtotal amount
- \`cart_total\` - Cart total amount
- \`user_agent\` - Browser/device information
- \`ip_address\` - User IP address
- \`referrer_url\` - Source URL
- \`visited_at\` - Visit timestamp
- \`created_at\` - Record creation timestamp

## Usage

### Tracking Cart Visits
Cart visits are tracked automatically when the cart page is viewed. The event listener captures:
- User/session identification
- Cart metrics (items, subtotal, total)
- User context (agent, IP, referrer)

### Viewing Analytics
Access the admin dashboard at:
\`\`\`
/admin/cart-visits
\`\`\`

### API Access
Query visit data programmatically:
\`\`\`javascript
// Get recent visits
const response = await fetch('/api/plugins/cart-hamid/visits?limit=50');
const { visits, total } = await response.json();

// Get statistics
const statsResponse = await fetch('/api/plugins/cart-hamid/stats');
const stats = await statsResponse.json();
\`\`\`

## Architecture

Built using clean plugin architecture:
- **Entity:** Database schema in \`plugin_entities\`
- **Controllers:** API handlers in \`plugin_controllers\`
- **Events:** Event listener in \`plugin_events\`
- **Migrations:** Schema changes in \`plugin_migrations\`
- **Components:** UI widgets in \`plugin_scripts\`

## Version

**Current Version:** 1.0.0

## Author

Created by Hamid

## License

MIT License
`;

async function createReadme() {
  try {
    console.log('📝 Creating README for Cart Hamid plugin...\n');

    // Check if README already exists
    const existing = await sequelize.query(`
      SELECT id FROM plugin_docs
      WHERE plugin_id = $1 AND doc_type = 'readme'
    `, {
      bind: [PLUGIN_ID],
      type: sequelize.QueryTypes.SELECT
    });

    if (existing.length > 0) {
      // Update existing
      await sequelize.query(`
        UPDATE plugin_docs
        SET content = $1, updated_at = NOW()
        WHERE plugin_id = $2 AND doc_type = 'readme'
      `, {
        bind: [README_CONTENT, PLUGIN_ID],
        type: sequelize.QueryTypes.UPDATE
      });
      console.log('✅ Updated existing README in plugin_docs');
    } else {
      // Insert new
      await sequelize.query(`
        INSERT INTO plugin_docs (plugin_id, doc_type, file_name, content, format, is_visible)
        VALUES ($1, 'readme', 'README.md', $2, 'markdown', true)
      `, {
        bind: [PLUGIN_ID, README_CONTENT],
        type: sequelize.QueryTypes.INSERT
      });
      console.log('✅ Created new README in plugin_docs');
    }

    console.log('\n📋 README.md created with:');
    console.log('   - Plugin description and features');
    console.log('   - Installation instructions');
    console.log('   - Database schema documentation');
    console.log('   - API usage examples');
    console.log('   - Architecture overview');

    console.log('\n✨ README.md will now appear in FileTree from plugin_docs table!');

    await sequelize.close();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createReadme();
