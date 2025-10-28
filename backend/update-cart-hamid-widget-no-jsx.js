/**
 * Update Cart Hamid widget to use React.createElement instead of JSX
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

async function updateWidget() {
  const client = await pool.connect();

  try {
    console.log('🔄 Updating Cart Hamid widget to plain JavaScript...\n');

    const widgetId = 'cart-hamid-widget';

    // Widget code without JSX - using React.createElement
    const componentCode = `function CartHamidWidget() {
  const [visitCount, setVisitCount] = React.useState(0);

  React.useEffect(() => {
    const handleCartView = () => {
      setVisitCount(prev => prev + 1);
    };

    window.addEventListener('cart-viewed', handleCartView);
    return () => window.removeEventListener('cart-viewed', handleCartView);
  }, []);

  return React.createElement('div', {
    style: {
      padding: '20px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      border: '2px solid #5a67d8',
      borderRadius: '12px',
      margin: '16px',
      color: 'white',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    }
  },
    React.createElement('h3', {
      style: { margin: '0 0 8px 0', fontSize: '18px' }
    }, '👋 Cart Hamid Plugin'),
    React.createElement('p', {
      style: { margin: 0, fontSize: '14px', opacity: 0.9 }
    }, 'Created by Hamid • Cart visits: ', React.createElement('strong', null, visitCount)),
    React.createElement('p', {
      style: { margin: '8px 0 0 0', fontSize: '12px', opacity: 0.8 }
    }, 'Testing database-driven plugin system ✨')
  );
}`;

    // Update widget in plugin_widgets table
    await client.query(`
      UPDATE plugin_widgets
      SET component_code = $1, updated_at = NOW()
      WHERE widget_id = $2
    `, [componentCode, widgetId]);

    console.log('✅ Widget code updated to use React.createElement');
    console.log('\n📋 Widget is now:');
    console.log('  - Pure JavaScript (no JSX)');
    console.log('  - Compatible with new Function() execution');
    console.log('  - Will render correctly on storefront');
    console.log('\n🧪 Test: Navigate to /cart to see the widget!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

updateWidget();
