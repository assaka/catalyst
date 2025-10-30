/**
 * Complete CRUD Example: Email Capture System
 * 100% Database-Driven - No Hardcoded Routes or Components!
 *
 * This example shows:
 * 1. Entity (plugin_entities) - Defines cart_emails table
 * 2. Controllers (plugin_controllers) - CRUD operations
 * 3. Event Listener (plugin_events) - Captures emails from cart
 * 4. Admin Page (plugin_admin_pages) - UI to view/manage emails
 * 5. Migration (plugin_migrations) - Creates the table
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

async function createEmailCaptureExample() {
  const client = await pool.connect();

  try {
    const pluginId = '4eb11832-5429-4146-af06-de86d319a0e5'; // Cart Alert (user's instance)

    console.log('📧 Creating Email Capture CRUD Example...\n');
    console.log('This demonstrates 100% database-driven plugin development:\n');

    // ============================================
    // STEP 1: Entity - Define the table structure
    // ============================================
    console.log('1️⃣ Creating Entity (plugin_entities)...');

    const entitySchema = {
      columns: [
        {
          name: 'id',
          type: 'UUID',
          primaryKey: true,
          default: 'gen_random_uuid()',
          comment: 'Primary key'
        },
        {
          name: 'email',
          type: 'VARCHAR(255)',
          notNull: true,
          comment: 'Email address captured from cart'
        },
        {
          name: 'session_id',
          type: 'VARCHAR(255)',
          nullable: true,
          comment: 'Session identifier'
        },
        {
          name: 'cart_total',
          type: 'DECIMAL(10, 2)',
          default: 0,
          comment: 'Cart total at capture time'
        },
        {
          name: 'cart_items_count',
          type: 'INTEGER',
          default: 0,
          comment: 'Number of items in cart'
        },
        {
          name: 'source',
          type: 'VARCHAR(50)',
          default: "'cart'",
          comment: 'Where email was captured from'
        },
        {
          name: 'subscribed',
          type: 'BOOLEAN',
          default: false,
          comment: 'Newsletter subscription status'
        },
        {
          name: 'created_at',
          type: 'TIMESTAMP WITH TIME ZONE',
          default: 'NOW()',
          comment: 'When email was captured'
        }
      ],
      indexes: [
        {
          name: 'idx_cart_emails_email',
          columns: ['email'],
          unique: true
        },
        {
          name: 'idx_cart_emails_created_at',
          columns: ['created_at'],
          order: 'DESC'
        }
      ],
      foreignKeys: []
    };

    const createTableSQL = `CREATE TABLE IF NOT EXISTS cart_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  session_id VARCHAR(255),
  cart_total DECIMAL(10, 2) DEFAULT 0,
  cart_items_count INTEGER DEFAULT 0,
  source VARCHAR(50) DEFAULT 'cart',
  subscribed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_cart_emails_email ON cart_emails(email);
CREATE INDEX IF NOT EXISTS idx_cart_emails_created_at ON cart_emails(created_at DESC);

COMMENT ON TABLE cart_emails IS 'Email addresses captured from cart for marketing';`;

    const dropTableSQL = `DROP TABLE IF EXISTS cart_emails CASCADE;`;

    // Check if entity exists
    const existingEntity = await client.query(`
      SELECT id FROM plugin_entities WHERE plugin_id = $1 AND entity_name = $2
    `, [pluginId, 'CartEmail']);

    if (existingEntity.rows.length > 0) {
      await client.query(`
        UPDATE plugin_entities
        SET schema_definition = $1, create_table_sql = $2, drop_table_sql = $3, updated_at = NOW()
        WHERE plugin_id = $4 AND entity_name = $5
      `, [entitySchema, createTableSQL, dropTableSQL, pluginId, 'CartEmail']);
      console.log('   ✅ Updated CartEmail entity');
    } else {
      await client.query(`
        INSERT INTO plugin_entities (
          plugin_id, entity_name, table_name, description,
          schema_definition, create_table_sql, drop_table_sql,
          migration_status, is_enabled, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', true, NOW(), NOW())
      `, [
        pluginId,
        'CartEmail',
        'cart_emails',
        'Email addresses captured from cart visitors',
        entitySchema,
        createTableSQL,
        dropTableSQL
      ]);
      console.log('   ✅ Created CartEmail entity');
    }

    // ============================================
    // STEP 2: Controllers - CRUD Operations
    // ============================================
    console.log('\n2️⃣ Creating CRUD Controllers (plugin_controllers)...\n');

    const controllers = [
      {
        name: 'createEmail',
        method: 'POST',
        path: '/emails',
        description: 'Create/capture a new email address',
        code: `async function createEmail(req, res, { sequelize }) {
  const { email, session_id, cart_total, cart_items_count, source = 'cart', subscribed = false } = req.body;

  if (!email || !email.match(/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/)) {
    return res.status(400).json({
      success: false,
      error: 'Valid email address is required'
    });
  }

  try {
    // Insert or update (upsert) email
    const result = await sequelize.query(\\\`
      INSERT INTO cart_emails (email, session_id, cart_total, cart_items_count, source, subscribed, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT (email) DO UPDATE
      SET cart_total = EXCLUDED.cart_total,
          cart_items_count = EXCLUDED.cart_items_count,
          source = EXCLUDED.source,
          subscribed = CASE WHEN cart_emails.subscribed THEN true ELSE EXCLUDED.subscribed END
      RETURNING *
    \\\`, {
      bind: [email, session_id, cart_total || 0, cart_items_count || 0, source, subscribed],
      type: sequelize.QueryTypes.INSERT
    });

    return res.json({
      success: true,
      email: result[0][0],
      message: 'Email captured successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}`
      },
      {
        name: 'getAllEmails',
        method: 'GET',
        path: '/emails',
        description: 'Get all captured emails with pagination',
        code: `async function getAllEmails(req, res, { sequelize }) {
  const limit = parseInt(req.query.limit) || 50;
  const offset = parseInt(req.query.offset) || 0;
  const search = req.query.search || '';

  try {
    let query = 'SELECT * FROM cart_emails';
    let countQuery = 'SELECT COUNT(*) as total FROM cart_emails';
    const params = [];

    if (search) {
      query += ' WHERE email ILIKE $1';
      countQuery += ' WHERE email ILIKE $1';
      params.push(\\\`%\\\${search}%\\\`);
    }

    query += \\\` ORDER BY created_at DESC LIMIT \\\${params.length + 1} OFFSET \\\${params.length + 2}\\\`;
    params.push(limit, offset);

    const emails = await sequelize.query(query, {
      bind: params,
      type: sequelize.QueryTypes.SELECT
    });

    const countResult = await sequelize.query(countQuery, {
      bind: search ? [params[0]] : [],
      type: sequelize.QueryTypes.SELECT
    });

    return res.json({
      success: true,
      emails,
      total: parseInt(countResult[0].total),
      limit,
      offset
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}`
      },
      {
        name: 'getEmailById',
        method: 'GET',
        path: '/emails/:id',
        description: 'Get a specific email by ID',
        code: `async function getEmailById(req, res, { sequelize }) {
  const { id } = req.params;

  try {
    const result = await sequelize.query(\\\`
      SELECT * FROM cart_emails WHERE id = $1
    \\\`, {
      bind: [id],
      type: sequelize.QueryTypes.SELECT
    });

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Email not found'
      });
    }

    return res.json({
      success: true,
      email: result[0]
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}`
      },
      {
        name: 'updateEmail',
        method: 'PUT',
        path: '/emails/:id',
        description: 'Update an email record',
        code: `async function updateEmail(req, res, { sequelize }) {
  const { id } = req.params;
  const { subscribed, source } = req.body;

  try {
    const result = await sequelize.query(\\\`
      UPDATE cart_emails
      SET subscribed = COALESCE($1, subscribed),
          source = COALESCE($2, source)
      WHERE id = $3
      RETURNING *
    \\\`, {
      bind: [subscribed, source, id],
      type: sequelize.QueryTypes.UPDATE
    });

    if (result[1].length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Email not found'
      });
    }

    return res.json({
      success: true,
      email: result[1][0],
      message: 'Email updated successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}`
      },
      {
        name: 'deleteEmail',
        method: 'DELETE',
        path: '/emails/:id',
        description: 'Delete an email record',
        code: `async function deleteEmail(req, res, { sequelize }) {
  const { id } = req.params;

  try {
    const result = await sequelize.query(\\\`
      DELETE FROM cart_emails WHERE id = $1
      RETURNING *
    \\\`, {
      bind: [id],
      type: sequelize.QueryTypes.DELETE
    });

    if (result[1].length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Email not found'
      });
    }

    return res.json({
      success: true,
      message: 'Email deleted successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}`
      },
      {
        name: 'getEmailStats',
        method: 'GET',
        path: '/emails/stats',
        description: 'Get email capture statistics',
        code: `async function getEmailStats(req, res, { sequelize }) {
  try {
    const stats = await sequelize.query(\\\`
      SELECT
        COUNT(*) as total_emails,
        COUNT(*) FILTER (WHERE subscribed = true) as subscribed_count,
        AVG(cart_total) as avg_cart_total,
        MAX(created_at) as last_captured
      FROM cart_emails
    \\\`, {
      type: sequelize.QueryTypes.SELECT
    });

    return res.json({
      success: true,
      ...stats[0]
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}`
      }
    ];

    for (const ctrl of controllers) {
      const existing = await client.query(`
        SELECT id FROM plugin_controllers WHERE plugin_id = $1 AND controller_name = $2
      `, [pluginId, ctrl.name]);

      if (existing.rows.length > 0) {
        await client.query(`
          UPDATE plugin_controllers
          SET method = $1, path = $2, handler_code = $3, description = $4, updated_at = NOW()
          WHERE plugin_id = $5 AND controller_name = $6
        `, [ctrl.method, ctrl.path, ctrl.code, ctrl.description, pluginId, ctrl.name]);
        console.log(`   ✅ Updated ${ctrl.method} ${ctrl.path}`);
      } else {
        await client.query(`
          INSERT INTO plugin_controllers (
            plugin_id, controller_name, method, path, handler_code, description,
            requires_auth, is_enabled, created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, true, true, NOW(), NOW())
        `, [pluginId, ctrl.name, ctrl.method, ctrl.path, ctrl.code, ctrl.description]);
        console.log(`   ✅ Created ${ctrl.method} ${ctrl.path}`);
      }
    }

    // ============================================
    // STEP 3: Event Listener - Capture emails
    // ============================================
    console.log('\n3️⃣ Creating Event Listener (plugin_events)...');

    const emailCaptureListener = `export default async function onCartViewedCaptureEmail(data) {
  // ✅ EXAMPLE: Capture email from cart data
  // This shows how to extract data from events and save to database

  console.log('📧 Email Capture Listener - Checking for email...');

  // Extract email from cart data (assuming you have user data)
  const email = data?.user?.email || data?.email;

  if (!email) {
    console.log('⚠️ No email found in cart data');
    return;
  }

  const { items = [], total = 0 } = data;

  // Call the CREATE controller to save email
  try {
    const response = await fetch('/api/plugins/my-cart-alert/exec/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        session_id: sessionStorage.getItem('session_id'),
        cart_total: total,
        cart_items_count: items.length,
        source: 'cart',
        subscribed: false
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Email captured:', result.email?.email);
    } else {
      console.error('❌ Failed to capture email');
    }
  } catch (error) {
    console.error('❌ Error capturing email:', error);
  }
}`;

    const existingListener = await client.query(`
      SELECT id FROM plugin_events WHERE plugin_id = $1 AND file_name = $2
    `, [pluginId, 'cart-viewed-capture-email.js']);

    if (existingListener.rows.length > 0) {
      await client.query(`
        UPDATE plugin_events
        SET listener_function = $1, updated_at = NOW()
        WHERE plugin_id = $2 AND file_name = $3
      `, [emailCaptureListener, pluginId, 'cart-viewed-capture-email.js']);
      console.log('   ✅ Updated cart-viewed-capture-email.js');
    } else {
      await client.query(`
        INSERT INTO plugin_events (
          plugin_id, event_name, file_name, listener_function, priority, is_enabled, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())
      `, [pluginId, 'cart.viewed', 'cart-viewed-capture-email.js', emailCaptureListener, 50]);
      console.log('   ✅ Created cart-viewed-capture-email.js');
    }

    // ============================================
    // STEP 4: Admin Page - Display & Manage
    // ============================================
    console.log('\n4️⃣ Creating Admin Page (plugin_admin_pages)...\n');

    const adminPageCode = `import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Mail, Trash2, Search, Download, TrendingUp } from 'lucide-react';

export default function EmailCaptureManager() {
  const [emails, setEmails] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Load emails from database via dynamic controller
  useEffect(() => {
    loadEmails();
    loadStats();
  }, [search]);

  const loadEmails = async () => {
    try {
      const response = await fetch(\\\`/api/plugins/my-cart-alert/exec/emails?search=\\\${search}\\\`);
      const data = await response.json();

      if (data.success) {
        setEmails(data.emails);
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to load emails:', error);
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/plugins/my-cart-alert/exec/emails/stats');
      const data = await response.json();

      if (data.success) {
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this email address?')) return;

    try {
      const response = await fetch(\\\`/api/plugins/my-cart-alert/exec/emails/\\\${id}\\\`, {
        method: 'DELETE'
      });

      if (response.ok) {
        loadEmails();
        loadStats();
      }
    } catch (error) {
      console.error('Failed to delete email:', error);
    }
  };

  const handleToggleSubscribe = async (email) => {
    try {
      const response = await fetch(\\\`/api/plugins/my-cart-alert/exec/emails/\\\${email.id}\\\`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscribed: !email.subscribed })
      });

      if (response.ok) {
        loadEmails();
        loadStats();
      }
    } catch (error) {
      console.error('Failed to update subscription:', error);
    }
  };

  const handleExport = () => {
    const csv = 'Email,Cart Total,Items,Subscribed,Source,Captured At\\\\n' +
      emails.map(e =>
        \\\`\\\${e.email},\\\${e.cart_total},\\\${e.cart_items_count},\\\${e.subscribed},\\\${e.source},\\\${e.created_at}\\\`
      ).join('\\\\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = \\\`cart-emails-\\\${Date.now()}.csv\\\`;
    a.click();
  };

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="w-6 h-6" />
              Email Capture Dashboard
            </div>
            <Button onClick={handleExport} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{stats.total_emails || 0}</div>
                  <div className="text-sm text-gray-500">Total Emails</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-green-600">
                    {stats.subscribed_count || 0}
                  </div>
                  <div className="text-sm text-gray-500">Subscribed</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    \\\${parseFloat(stats.avg_cart_total || 0).toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-500">Avg Cart Value</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm font-bold">
                    {stats.last_captured ? new Date(stats.last_captured).toLocaleDateString() : 'N/A'}
                  </div>
                  <div className="text-sm text-gray-500">Last Capture</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Search */}
          <div className="mb-4">
            <Input
              placeholder="Search emails..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-md"
            />
          </div>

          {/* Email List */}
          <div className="space-y-2">
            {loading ? (
              <p>Loading emails...</p>
            ) : emails.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No emails captured yet</p>
            ) : (
              emails.map(email => (
                <div key={email.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">{email.email}</span>
                      {email.subscribed && (
                        <Badge className="bg-green-100 text-green-700">Subscribed</Badge>
                      )}
                      <Badge variant="outline" className="text-xs">{email.source}</Badge>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      Cart: \\\${email.cart_total?.toFixed(2) || 0} • {email.cart_items_count} items •
                      {new Date(email.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleSubscribe(email)}
                    >
                      {email.subscribed ? 'Unsubscribe' : 'Subscribe'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(email.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}`;

    const existingPage = await client.query(`
      SELECT id FROM plugin_admin_pages WHERE plugin_id = $1 AND page_key = $2
    `, [pluginId, 'email-capture']);

    if (existingPage.rows.length > 0) {
      await client.query(`
        UPDATE plugin_admin_pages
        SET component_code = $1, updated_at = NOW()
        WHERE plugin_id = $2 AND page_key = $3
      `, [adminPageCode, pluginId, 'email-capture']);
      console.log('   ✅ Updated Email Capture admin page');
    } else {
      await client.query(`
        INSERT INTO plugin_admin_pages (
          plugin_id, page_key, page_name, route, component_code,
          description, icon, category, order_position, is_enabled, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, NOW(), NOW())
      `, [
        pluginId,
        'email-capture',
        'Email Capture',
        '/admin/plugins/my-cart-alert/emails',
        adminPageCode,
        'View and manage captured email addresses from cart',
        'Mail',
        'marketing',
        100
      ]);
      console.log('   ✅ Created Email Capture admin page');
    }

    // ============================================
    // Summary
    // ============================================
    console.log('\n' + '='.repeat(60));
    console.log('✅ EMAIL CAPTURE CRUD EXAMPLE CREATED!');
    console.log('='.repeat(60));

    console.log('\n📦 What was created (100% database-driven):');
    console.log('\n1️⃣ ENTITY (plugin_entities):');
    console.log('   • CartEmail entity → cart_emails table');
    console.log('   • Stores: email, cart_total, subscribed, etc.');

    console.log('\n2️⃣ CONTROLLERS (plugin_controllers):');
    console.log('   • POST   /api/plugins/my-cart-alert/exec/emails');
    console.log('   • GET    /api/plugins/my-cart-alert/exec/emails');
    console.log('   • GET    /api/plugins/my-cart-alert/exec/emails/:id');
    console.log('   • PUT    /api/plugins/my-cart-alert/exec/emails/:id');
    console.log('   • DELETE /api/plugins/my-cart-alert/exec/emails/:id');
    console.log('   • GET    /api/plugins/my-cart-alert/exec/emails/stats');

    console.log('\n3️⃣ EVENT LISTENER (plugin_events):');
    console.log('   • cart-viewed-capture-email.js');
    console.log('   • Listens to: cart.viewed');
    console.log('   • Extracts email and calls POST /emails');

    console.log('\n4️⃣ ADMIN PAGE (plugin_admin_pages):');
    console.log('   • Route: /admin/plugins/my-cart-alert/emails');
    console.log('   • Shows: Email list with stats');
    console.log('   • Features: Search, Delete, Subscribe/Unsubscribe, Export CSV');

    console.log('\n📋 HOW IT WORKS (Complete Flow):');
    console.log('   1. User views cart → cart.viewed event fires');
    console.log('   2. Event listener extracts email from data');
    console.log('   3. Calls POST /api/plugins/my-cart-alert/exec/emails');
    console.log('   4. Controller inserts into cart_emails table');
    console.log('   5. Admin visits /admin/plugins/my-cart-alert/emails');
    console.log('   6. Admin page fetches via GET /api/plugins/my-cart-alert/exec/emails');
    console.log('   7. Admin can CRUD emails via controllers');

    console.log('\n🚀 NEXT STEPS:');
    console.log('   1. Run migration to create cart_emails table:');
    console.log('      → Open plugin editor');
    console.log('      → Find entities/CartEmail.json');
    console.log('      → Click "Generate Migration"');
    console.log('      → Run the migration');
    console.log('');
    console.log('   2. Visit admin page:');
    console.log('      → Go to /admin/plugins/cart-hamid/emails');
    console.log('');
    console.log('   3. Test email capture:');
    console.log('      → Visit cart page with user email in data');
    console.log('      → Check admin page for captured email');

    console.log('\n💡 This is a COMPLETE CRUD example - 100% database-driven!');
    console.log('   No hardcoded routes, no hardcoded components!');
    console.log('   Everything comes from the database tables! 🎉');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

createEmailCaptureExample();
