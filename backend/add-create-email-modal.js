/**
 * Add Create Email modal to EmailCaptureManager component
 * 100% database-driven - updates component_code in plugin_admin_pages
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

async function addCreateEmailModal() {
  const client = await pool.connect();

  try {
    const pluginId = '4eb11832-5429-4146-af06-de86d319a0e5';

    console.log('🔧 Adding Create Email modal to admin page...\n');

    // Updated component with Create modal - using React.createElement (no JSX)
    const componentWithModal = `import React, { useState, useEffect } from 'react';
import apiClient from '@/api/client';

export default function EmailCaptureManager() {
  const [emails, setEmails] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEmail, setNewEmail] = useState({
    email: '',
    cart_total: 0,
    cart_items_count: 0,
    source: 'manual',
    subscribed: false
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const emailsRes = await apiClient.get('plugins/my-cart-alert/exec/emails');
      if (emailsRes.data.success) {
        setEmails(emailsRes.data.emails || []);
      }

      const statsRes = await apiClient.get('plugins/my-cart-alert/exec/emails/stats');
      if (statsRes.data.success) {
        setStats(statsRes.data);
      }

      setLoading(false);
    } catch (error) {
      console.error('Failed to load emails:', error);
      setLoading(false);
    }
  };

  const handleCreateEmail = async () => {
    if (!newEmail.email || !newEmail.email.match(/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/)) {
      alert('Please enter a valid email address');
      return;
    }

    setCreating(true);

    try {
      const response = await apiClient.post('plugins/my-cart-alert/exec/emails', newEmail);

      if (response.data.success) {
        setShowCreateModal(false);
        setNewEmail({ email: '', cart_total: 0, cart_items_count: 0, source: 'manual', subscribed: false });
        loadData();
      } else {
        alert('Failed to create email: ' + (response.data.error || 'Unknown error'));
      }
    } catch (error) {
      alert('Error: ' + (error.response?.data?.error || error.message));
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this email?')) return;

    try {
      await apiClient.delete('plugins/my-cart-alert/exec/emails/' + id);
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
      React.createElement('div', { className: 'flex items-center justify-between mb-6' },
        React.createElement('h1', { className: 'text-2xl font-bold' }, '📧 Email Capture Dashboard'),
        React.createElement('button', {
          onClick: () => setShowCreateModal(true),
          className: 'px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700'
        }, '+ Add Email')
      ),

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
                    'Cart: $' + parseFloat(email.cart_total || 0).toFixed(2) +
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
      ),

      showCreateModal && React.createElement('div', {
        className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50',
        onClick: () => setShowCreateModal(false)
      },
        React.createElement('div', {
          className: 'bg-white rounded-lg p-6 w-full max-w-md',
          onClick: (e) => e.stopPropagation()
        },
          React.createElement('h2', { className: 'text-xl font-bold mb-4' }, '📧 Add Email Address'),

          React.createElement('div', { className: 'space-y-4' },
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium mb-1' }, 'Email Address *'),
              React.createElement('input', {
                type: 'email',
                value: newEmail.email,
                onChange: (e) => setNewEmail({ ...newEmail, email: e.target.value }),
                placeholder: 'user@example.com',
                className: 'w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500',
                required: true
              })
            ),

            React.createElement('div', { className: 'grid grid-cols-2 gap-4' },
              React.createElement('div', null,
                React.createElement('label', { className: 'block text-sm font-medium mb-1' }, 'Cart Total'),
                React.createElement('input', {
                  type: 'number',
                  step: '0.01',
                  value: newEmail.cart_total,
                  onChange: (e) => setNewEmail({ ...newEmail, cart_total: parseFloat(e.target.value) || 0 }),
                  className: 'w-full px-3 py-2 border rounded'
                })
              ),
              React.createElement('div', null,
                React.createElement('label', { className: 'block text-sm font-medium mb-1' }, 'Items Count'),
                React.createElement('input', {
                  type: 'number',
                  value: newEmail.cart_items_count,
                  onChange: (e) => setNewEmail({ ...newEmail, cart_items_count: parseInt(e.target.value) || 0 }),
                  className: 'w-full px-3 py-2 border rounded'
                })
              )
            ),

            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium mb-1' }, 'Source'),
              React.createElement('select', {
                value: newEmail.source,
                onChange: (e) => setNewEmail({ ...newEmail, source: e.target.value }),
                className: 'w-full px-3 py-2 border rounded'
              },
                React.createElement('option', { value: 'manual' }, 'Manual Entry'),
                React.createElement('option', { value: 'cart' }, 'Cart Capture'),
                React.createElement('option', { value: 'checkout' }, 'Checkout'),
                React.createElement('option', { value: 'import' }, 'Import')
              )
            ),

            React.createElement('div', { className: 'flex items-center gap-2' },
              React.createElement('input', {
                type: 'checkbox',
                checked: newEmail.subscribed,
                onChange: (e) => setNewEmail({ ...newEmail, subscribed: e.target.checked }),
                className: 'w-4 h-4'
              }),
              React.createElement('label', { className: 'text-sm' }, 'Subscribed to newsletter')
            )
          ),

          React.createElement('div', { className: 'flex gap-2 mt-6' },
            React.createElement('button', {
              onClick: handleCreateEmail,
              disabled: creating,
              className: 'flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50'
            }, creating ? 'Creating...' : 'Create Email'),
            React.createElement('button', {
              onClick: () => setShowCreateModal(false),
              className: 'flex-1 px-4 py-2 border rounded hover:bg-gray-50'
            }, 'Cancel')
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
    `, [componentWithModal, pluginId, 'emails']);

    console.log('✅ Updated Email Capture component with Create modal!');

    console.log('\n📋 New Features Added:');
    console.log('   • [+ Add Email] button in header');
    console.log('   • Create Email modal dialog');
    console.log('   • Form fields:');
    console.log('     - Email address (required, validated)');
    console.log('     - Cart Total (optional)');
    console.log('     - Items Count (optional)');
    console.log('     - Source dropdown (manual, cart, checkout, import)');
    console.log('     - Subscribed checkbox');
    console.log('   • Calls: POST /api/plugins/my-cart-alert/exec/emails');
    console.log('   • Auto-refreshes list after creation');

    console.log('\n💡 100% Database-Driven:');
    console.log('   ✅ Modal component stored in plugin_admin_pages.component_code');
    console.log('   ✅ Uses POST /exec/emails controller from plugin_controllers');
    console.log('   ✅ Inserts into cart_emails table from plugin_entities');
    console.log('   ✅ No hardcoded forms, modals, or routes!');

    console.log('\n🧪 Test:');
    console.log('   1. Wait for deployment');
    console.log('   2. Refresh app');
    console.log('   3. Visit: /admin/plugins/my-cart-alert/emails');
    console.log('   4. Click [+ Add Email] button');
    console.log('   5. Fill form and create!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

addCreateEmailModal();
