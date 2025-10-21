/**
 * Create Test Page Component in Database
 * Stores the React component for the test page in plugin_admin_pages
 *
 * This makes the page fully database-driven - both navigation and component.
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

const PAGE_COMPONENT = `import React from 'react';

export default function TestPage() {
  return (
    <div style={{
      padding: '40px',
      maxWidth: '800px',
      margin: '0 auto',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '32px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px'
          }}>
            🧪
          </div>
          <h1 style={{
            margin: 0,
            fontSize: '32px',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Test Page (Database-Driven)
          </h1>
        </div>

        <div style={{
          padding: '20px',
          background: '#f0fdf4',
          border: '2px solid #86efac',
          borderRadius: '8px',
          marginBottom: '24px'
        }}>
          <h2 style={{
            margin: '0 0 12px 0',
            fontSize: '18px',
            fontWeight: '600',
            color: '#166534'
          }}>
            ✅ Success!
          </h2>
          <p style={{
            margin: 0,
            fontSize: '14px',
            color: '#15803d',
            lineHeight: '1.6'
          }}>
            This page is <strong>100% database-driven</strong>. Both the navigation entry
            and this React component are stored in the database and loaded dynamically.
          </p>
        </div>

        <div style={{
          background: '#f9fafb',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '24px'
        }}>
          <h3 style={{
            margin: '0 0 16px 0',
            fontSize: '16px',
            fontWeight: '600',
            color: '#111827'
          }}>
            📊 Technical Details
          </h3>
          <ul style={{
            margin: 0,
            padding: '0 0 0 20px',
            fontSize: '14px',
            color: '#374151',
            lineHeight: '1.8'
          }}>
            <li><strong>Navigation Entry:</strong> admin_navigation_registry table</li>
            <li><strong>Component Code:</strong> plugin_admin_pages table</li>
            <li><strong>Route:</strong> /admin/dummy-test</li>
            <li><strong>Key:</strong> test-dummy-page</li>
            <li><strong>Loaded:</strong> {new Date().toLocaleString()}</li>
          </ul>
        </div>

        <div style={{
          background: '#eff6ff',
          padding: '20px',
          borderRadius: '8px',
          borderLeft: '4px solid #3b82f6'
        }}>
          <h3 style={{
            margin: '0 0 12px 0',
            fontSize: '16px',
            fontWeight: '600',
            color: '#1e40af'
          }}>
            💡 How It Works
          </h3>
          <ol style={{
            margin: 0,
            padding: '0 0 0 20px',
            fontSize: '14px',
            color: '#1e3a8a',
            lineHeight: '1.8'
          }}>
            <li>Navigation entry created in <code>admin_navigation_registry</code></li>
            <li>Component stored in <code>plugin_admin_pages</code> table</li>
            <li>Backend API serves navigation structure</li>
            <li>Frontend Layout.jsx reads and renders navigation</li>
            <li>Dynamic route loader renders the component</li>
          </ol>
        </div>

        <div style={{
          marginTop: '32px',
          paddingTop: '24px',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>
            Database-Driven Admin Page System
          </div>
          <button
            onClick={() => window.history.back()}
            style={{
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              boxShadow: '0 2px 4px rgba(102, 126, 234, 0.4)'
            }}
          >
            ← Go Back
          </button>
        </div>
      </div>
    </div>
  );
}`;

async function createPageComponent() {
  const client = await pool.connect();

  try {
    console.log('🚀 Creating Test Page Component...\n');

    // Insert into plugin_admin_pages
    console.log('📝 Adding page component to plugin_admin_pages...');
    await client.query(`
      INSERT INTO plugin_admin_pages (
        plugin_id, page_key, page_name, route, component_code, is_enabled
      ) VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (plugin_id, page_key) DO UPDATE SET
        page_name = EXCLUDED.page_name,
        route = EXCLUDED.route,
        component_code = EXCLUDED.component_code,
        is_enabled = EXCLUDED.is_enabled,
        updated_at = CURRENT_TIMESTAMP
    `, [
      'core',                        // plugin_id (using 'core' for non-plugin pages)
      'test-dummy-page',             // page_key (matches navigation key)
      'Test Page',                   // page_name
      '/admin/dummy-test',           // route
      PAGE_COMPONENT,                // component_code
      true                           // is_enabled
    ]);

    console.log('✅ Page component created successfully!');
    console.log('\n📊 Component Details:');
    console.log('  - Plugin ID: core');
    console.log('  - Page Key: test-dummy-page');
    console.log('  - Route: /admin/dummy-test');
    console.log('  - Component Size:', PAGE_COMPONENT.length, 'characters');

    // Verify the entry was created
    console.log('\n🔍 Verifying component in database...');
    const verifyResult = await client.query(`
      SELECT plugin_id, page_key, page_name, route, is_enabled,
             LENGTH(component_code) as code_length
      FROM plugin_admin_pages
      WHERE page_key = 'test-dummy-page'
    `);

    if (verifyResult.rows.length > 0) {
      console.log('✅ Component verified:');
      console.table(verifyResult.rows);
    } else {
      console.log('❌ Component not found!');
    }

    console.log('\n='.repeat(60));
    console.log('✅ Test Page Component Created Successfully!');
    console.log('='.repeat(60));

    console.log('\n📝 Next Steps:');
    console.log('  1. Implement dynamic component loader in the frontend');
    console.log('  2. Add route handler in App.jsx to load database components');
    console.log('  3. Hard refresh browser and navigate to /admin/dummy-test');

    console.log('\n💡 Alternative: Create a static route in App.jsx for now:');
    console.log('     <Route path="/admin/dummy-test"');
    console.log('            element={<PageWrapper Component={TestPage} pageName="DummyTestPage" />} />');

  } catch (error) {
    console.error('❌ Error creating page component:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createPageComponent()
  .then(() => {
    console.log('\n🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
