/**
 * Fix Email Capture admin component - remove problematic escapes
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

async function fixEmailAdminComponent() {
  const client = await pool.connect();

  try {
    const pluginId = '4eb11832-5429-4146-af06-de86d319a0e5';

    console.log('🔧 Fixing Email Capture admin component...\n');

    // Simplified component without problematic escapes
    const fixedComponentCode = `import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Mail, Trash2, Search, Download } from 'lucide-react';

export default function EmailCaptureManager() {
  const [emails, setEmails] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadEmails();
    loadStats();
  }, [search]);

  const loadEmails = async () => {
    try {
      const url = '/api/plugins/my-cart-alert/exec/emails' + (search ? '?search=' + search : '');
      const response = await fetch(url);
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
      const response = await fetch('/api/plugins/my-cart-alert/exec/emails/' + id, {
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
      const response = await fetch('/api/plugins/my-cart-alert/exec/emails/' + email.id, {
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
    const csv = 'Email,Cart Total,Items,Subscribed,Source,Captured At' + String.fromCharCode(10) +
      emails.map(e =>
        e.email + ',' + e.cart_total + ',' + e.cart_items_count + ',' + e.subscribed + ',' + e.source + ',' + e.created_at
      ).join(String.fromCharCode(10));

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cart-emails-' + Date.now() + '.csv';
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
                    {'$' + parseFloat(stats.avg_cart_total || 0).toFixed(2)}
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

          <div className="mb-4">
            <Input
              placeholder="Search emails..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-md"
            />
          </div>

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
                      {'Cart: $' + (email.cart_total?.toFixed(2) || 0) + ' • ' + email.cart_items_count + ' items • ' + new Date(email.created_at).toLocaleDateString()}
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

    await client.query(`
      UPDATE plugin_admin_pages
      SET component_code = $1, updated_at = NOW()
      WHERE plugin_id = $2 AND page_key = $3
    `, [fixedComponentCode, pluginId, 'emails']);

    console.log('✅ Updated Email Capture component');
    console.log('\n📋 Changes:');
    console.log('   • Removed ALL template literals with escape sequences');
    console.log('   • Used string concatenation instead: "text" + variable');
    console.log('   • Used String.fromCharCode(10) for newlines in CSV');
    console.log('   • No more \\\\\\` or \\\\\\$ escapes');

    console.log('\n🧪 Test now:');
    console.log('   Visit: http://localhost:5179/admin/plugins/my-cart-alert/emails');
    console.log('   Should load without "invalid escape sequence" error!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

fixEmailAdminComponent();
