/**
 * Create a simplified Email Capture admin page without JSX
 * Uses React.createElement directly - works with eval()
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

async function createSimpleEmailAdmin() {
  const client = await pool.connect();

  try {
    const pluginId = '4eb11832-5429-4146-af06-de86d319a0e5';

    console.log('🔧 Creating simplified Email Capture admin page (no JSX)...\n');

    // Simple component using React.createElement (no JSX)
    const simpleComponent = `import React, { useState, useEffect } from 'react';
import apiClient from '@/api/client';

export default function EmailCaptureManager() {
  const [emails, setEmails] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load emails
      const emailsRes = await fetch('/api/plugins/my-cart-alert/exec/emails');
      const emailsData = await emailsRes.json();
      if (emailsData.success) {
        setEmails(emailsData.emails || []);
      }

      // Load stats
      const statsRes = await fetch('/api/plugins/my-cart-alert/exec/emails/stats');
      const statsData = await statsRes.json();
      if (statsData.success) {
        setStats(statsData);
      }

      setLoading(false);
    } catch (error) {
      console.error('Failed to load emails:', error);
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this email?')) return;

    try {
      await fetch('/api/plugins/my-cart-alert/exec/emails/' + id, { method: 'DELETE' });
      loadData();
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  if (loading) {
    return React.createElement('div', { className: 'p-6' },
      React.createElement('p', null, 'Loading emails...')
    );
  }

  return React.createElement('div', { className: 'p-6' },
    React.createElement('div', { className: 'bg-white rounded-lg shadow p-6' },
      React.createElement('h1', { className: 'text-2xl font-bold mb-6' },
        '📧 Email Capture Dashboard'
      ),

      // Stats
      stats && React.createElement('div', { className: 'grid grid-cols-4 gap-4 mb-6' },
        React.createElement('div', { className: 'bg-blue-50 p-4 rounded' },
          React.createElement('div', { className: 'text-3xl font-bold' }, stats.total_emails || 0),
          React.createElement('div', { className: 'text-sm text-gray-600' }, 'Total Emails')
        ),
        React.createElement('div', { className: 'bg-green-50 p-4 rounded' },
          React.createElement('div', { className: 'text-3xl font-bold text-green-600' }, stats.subscribed_count || 0),
          React.createElement('div', { className: 'text-sm text-gray-600' }, 'Subscribed')
        ),
        React.createElement('div', { className: 'bg-purple-50 p-4 rounded' },
          React.createElement('div', { className: 'text-3xl font-bold' }, '$' + parseFloat(stats.avg_cart_total || 0).toFixed(2)),
          React.createElement('div', { className: 'text-sm text-gray-600' }, 'Avg Cart Value')
        ),
        React.createElement('div', { className: 'bg-gray-50 p-4 rounded' },
          React.createElement('div', { className: 'text-xl font-bold' }, stats.last_captured ? new Date(stats.last_captured).toLocaleDateString() : 'N/A'),
          React.createElement('div', { className: 'text-sm text-gray-600' }, 'Last Captured')
        )
      ),

      // Email list
      React.createElement('div', { className: 'space-y-3' },
        emails.length === 0
          ? React.createElement('p', { className: 'text-gray-500 text-center py-8' }, 'No emails captured yet')
          : emails.map(email =>
              React.createElement('div', {
                key: email.id,
                className: 'flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50'
              },
                React.createElement('div', { className: 'flex-1' },
                  React.createElement('div', { className: 'font-medium text-lg' }, email.email),
                  React.createElement('div', { className: 'text-sm text-gray-500 mt-1' },
                    'Cart: $' + (email.cart_total || 0).toFixed(2) +
                    ' • ' + (email.cart_items_count || 0) + ' items • ' +
                    new Date(email.created_at).toLocaleDateString() +
                    (email.subscribed ? ' • ✅ Subscribed' : '')
                  )
                ),
                React.createElement('button', {
                  onClick: () => handleDelete(email.id),
                  className: 'px-4 py-2 text-red-600 hover:bg-red-50 rounded'
                }, '🗑️ Delete')
              )
            )
      )
    )
  );
}`;

    await client.query(`
      UPDATE plugin_admin_pages
      SET component_code = $1, updated_at = NOW()
      WHERE plugin_id = $2 AND page_key = $3
    `, [simpleComponent, pluginId, 'emails']);

    console.log('✅ Updated Email Capture component (no JSX)');
    console.log('\n📋 Changes:');
    console.log('   • Replaced ALL JSX with React.createElement');
    console.log('   • No <div>, <Card>, etc. - pure JavaScript!');
    console.log('   • Works directly with eval()');
    console.log('   • No transpilation needed');

    console.log('\n🧪 Test now:');
    console.log('   Visit: http://localhost:5179/admin/plugins/my-cart-alert/emails');
    console.log('   Should load without JSX errors!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

createSimpleEmailAdmin();
