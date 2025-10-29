// Script to extend Cart Hamid plugin with database, model, controller, and admin page
// Adds everything directly to plugin_registry tables

// Load environment variables
require('dotenv').config();

const { sequelize } = require('./src/database/connection');

const PLUGIN_ID = '109c940f-5d33-472c-b7df-c48e68c35696';

async function extendCartHamidPlugin() {
  try {
    console.log('🚀 Extending Cart Hamid Plugin...\n');

    // 1. Add database migration script
    console.log('1️⃣ Adding database migration script...');
    await sequelize.query(`
      INSERT INTO plugin_scripts (plugin_id, file_name, file_content, script_type, scope, load_priority)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT DO NOTHING
    `, {
      bind: [
        PLUGIN_ID,
        'migrations/create-hamid-cart-table.js',
        `// Migration to create hamid_cart table
module.exports = {
  async up(sequelize) {
    await sequelize.query(\`
      CREATE TABLE IF NOT EXISTS hamid_cart (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID,
        session_id VARCHAR(255),
        cart_items_count INTEGER DEFAULT 0,
        cart_subtotal DECIMAL(10, 2) DEFAULT 0.00,
        cart_total DECIMAL(10, 2) DEFAULT 0.00,
        user_agent TEXT,
        ip_address VARCHAR(45),
        referrer_url TEXT,
        visited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_hamid_cart_user ON hamid_cart(user_id);
      CREATE INDEX IF NOT EXISTS idx_hamid_cart_session ON hamid_cart(session_id);
      CREATE INDEX IF NOT EXISTS idx_hamid_cart_visited_at ON hamid_cart(visited_at DESC);
    \`);
    console.log('✅ hamid_cart table created');
  },

  async down(sequelize) {
    await sequelize.query('DROP TABLE IF EXISTS hamid_cart CASCADE;');
  }
};`,
        'js',
        'backend',
        0
      ]
    });
    console.log('   ✅ Migration script added\n');

    // 2. Add Sequelize model
    console.log('2️⃣ Adding Sequelize model...');
    await sequelize.query(`
      INSERT INTO plugin_scripts (plugin_id, file_name, file_content, script_type, scope, load_priority)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT DO NOTHING
    `, {
      bind: [
        PLUGIN_ID,
        'models/HamidCart.js',
        `// HamidCart model for tracking cart visits
export default function HamidCart(sequelize, DataTypes) {
  return sequelize.define('HamidCart', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: true
    },
    session_id: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    cart_items_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    cart_subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00
    },
    cart_total: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true
    },
    referrer_url: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    visited_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'hamid_cart',
    timestamps: false
  });
}`,
        'js',
        'backend',
        1
      ]
    });
    console.log('   ✅ Model added\n');

    // 3. Add API controller/service
    console.log('3️⃣ Adding API controller...');
    await sequelize.query(`
      INSERT INTO plugin_scripts (plugin_id, file_name, file_content, script_type, scope, load_priority)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT DO NOTHING
    `, {
      bind: [
        PLUGIN_ID,
        'controllers/CartVisitsController.js',
        `// API Controller for cart visits tracking
export default class CartVisitsController {
  constructor(sequelize) {
    this.sequelize = sequelize;
  }

  // Track a cart visit
  async trackVisit(data) {
    try {
      const result = await this.sequelize.query(\`
        INSERT INTO hamid_cart (
          user_id, session_id, cart_items_count,
          cart_subtotal, cart_total, user_agent,
          ip_address, referrer_url
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      \`, {
        bind: [
          data.user_id || null,
          data.session_id || null,
          data.cart_items_count || 0,
          data.cart_subtotal || 0,
          data.cart_total || 0,
          data.user_agent || null,
          data.ip_address || null,
          data.referrer_url || null
        ],
        type: this.sequelize.QueryTypes.INSERT
      });
      return result[0][0];
    } catch (error) {
      console.error('Error tracking cart visit:', error);
      throw error;
    }
  }

  // Get all cart visits with pagination
  async getVisits(limit = 50, offset = 0) {
    try {
      const visits = await this.sequelize.query(\`
        SELECT * FROM hamid_cart
        ORDER BY visited_at DESC
        LIMIT $1 OFFSET $2
      \`, {
        bind: [limit, offset],
        type: this.sequelize.QueryTypes.SELECT
      });

      const countResult = await this.sequelize.query(\`
        SELECT COUNT(*) as total FROM hamid_cart
      \`, {
        type: this.sequelize.QueryTypes.SELECT
      });

      return {
        visits,
        total: parseInt(countResult[0].total),
        limit,
        offset
      };
    } catch (error) {
      console.error('Error fetching cart visits:', error);
      throw error;
    }
  }

  // Get visit statistics
  async getStats() {
    try {
      const stats = await this.sequelize.query(\`
        SELECT
          COUNT(*) as total_visits,
          COUNT(DISTINCT user_id) as unique_users,
          COUNT(DISTINCT session_id) as unique_sessions,
          AVG(cart_items_count) as avg_items,
          AVG(cart_total) as avg_total,
          MAX(visited_at) as last_visit
        FROM hamid_cart
      \`, {
        type: this.sequelize.QueryTypes.SELECT
      });
      return stats[0];
    } catch (error) {
      console.error('Error fetching stats:', error);
      throw error;
    }
  }
}`,
        'js',
        'backend',
        2
      ]
    });
    console.log('   ✅ Controller added\n');

    // 4. Add admin page component
    console.log('4️⃣ Adding admin page component...');
    await sequelize.query(`
      INSERT INTO plugin_scripts (plugin_id, file_name, file_content, script_type, scope, load_priority)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT DO NOTHING
    `, {
      bind: [
        PLUGIN_ID,
        'admin/CartVisitsPage.jsx',
        `// Admin page to display cart visit analytics
export default function CartVisitsPage() {
  const [visits, setVisits] = React.useState([]);
  const [stats, setStats] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Fetch visits and stats from API
      const [visitsRes, statsRes] = await Promise.all([
        fetch('/api/plugins/cart-hamid/visits'),
        fetch('/api/plugins/cart-hamid/stats')
      ]);

      const visitsData = await visitsRes.json();
      const statsData = await statsRes.json();

      setVisits(visitsData.visits || []);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading cart visits:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return React.createElement('div', {
      style: { padding: '20px', textAlign: 'center' }
    }, 'Loading cart visits...');
  }

  return React.createElement('div', {
    style: { padding: '20px', maxWidth: '1200px', margin: '0 auto' }
  },
    // Header
    React.createElement('h1', {
      style: { fontSize: '24px', marginBottom: '10px' }
    }, '🛒 Cart Visit Analytics'),

    React.createElement('p', {
      style: { color: '#666', marginBottom: '30px' }
    }, 'Track and analyze cart page visits'),

    // Stats Cards
    stats && React.createElement('div', {
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }
    },
      React.createElement('div', {
        style: {
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }
      },
        React.createElement('div', { style: { fontSize: '14px', opacity: 0.9 } }, 'Total Visits'),
        React.createElement('div', { style: { fontSize: '32px', fontWeight: 'bold', marginTop: '8px' } },
          stats.total_visits || 0
        )
      ),

      React.createElement('div', {
        style: {
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          color: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }
      },
        React.createElement('div', { style: { fontSize: '14px', opacity: 0.9 } }, 'Unique Users'),
        React.createElement('div', { style: { fontSize: '32px', fontWeight: 'bold', marginTop: '8px' } },
          stats.unique_users || 0
        )
      ),

      React.createElement('div', {
        style: {
          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
          color: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }
      },
        React.createElement('div', { style: { fontSize: '14px', opacity: 0.9 } }, 'Avg Items'),
        React.createElement('div', { style: { fontSize: '32px', fontWeight: 'bold', marginTop: '8px' } },
          stats.avg_items ? parseFloat(stats.avg_items).toFixed(1) : '0'
        )
      ),

      React.createElement('div', {
        style: {
          background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
          color: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }
      },
        React.createElement('div', { style: { fontSize: '14px', opacity: 0.9 } }, 'Avg Cart Total'),
        React.createElement('div', { style: { fontSize: '32px', fontWeight: 'bold', marginTop: '8px' } },
          stats.avg_total ? '$' + parseFloat(stats.avg_total).toFixed(2) : '$0.00'
        )
      )
    ),

    // Visits Table
    React.createElement('div', {
      style: {
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }
    },
      React.createElement('div', {
        style: {
          padding: '20px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }
      },
        React.createElement('h2', { style: { fontSize: '18px', margin: 0 } }, 'Recent Visits'),
        React.createElement('button', {
          onClick: loadData,
          style: {
            padding: '8px 16px',
            background: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }
        }, '🔄 Refresh')
      ),

      React.createElement('div', { style: { overflowX: 'auto' } },
        React.createElement('table', {
          style: { width: '100%', borderCollapse: 'collapse' }
        },
          React.createElement('thead', null,
            React.createElement('tr', {
              style: { background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }
            },
              React.createElement('th', { style: { padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' } }, 'Date/Time'),
              React.createElement('th', { style: { padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' } }, 'Session'),
              React.createElement('th', { style: { padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#6b7280' } }, 'Items'),
              React.createElement('th', { style: { padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#6b7280' } }, 'Subtotal'),
              React.createElement('th', { style: { padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#6b7280' } }, 'Total')
            )
          ),
          React.createElement('tbody', null,
            visits.length === 0
              ? React.createElement('tr', null,
                  React.createElement('td', {
                    colSpan: 5,
                    style: { padding: '40px', textAlign: 'center', color: '#9ca3af' }
                  }, 'No cart visits recorded yet')
                )
              : visits.map((visit, index) =>
                  React.createElement('tr', {
                    key: visit.id,
                    style: { borderBottom: '1px solid #e5e7eb' }
                  },
                    React.createElement('td', { style: { padding: '12px', fontSize: '14px' } },
                      new Date(visit.visited_at).toLocaleString()
                    ),
                    React.createElement('td', { style: { padding: '12px', fontSize: '14px', fontFamily: 'monospace', color: '#6b7280' } },
                      (visit.session_id || 'N/A').substring(0, 8) + '...'
                    ),
                    React.createElement('td', { style: { padding: '12px', fontSize: '14px', textAlign: 'right' } },
                      visit.cart_items_count
                    ),
                    React.createElement('td', { style: { padding: '12px', fontSize: '14px', textAlign: 'right' } },
                      '$' + parseFloat(visit.cart_subtotal || 0).toFixed(2)
                    ),
                    React.createElement('td', { style: { padding: '12px', fontSize: '14px', textAlign: 'right', fontWeight: '600' } },
                      '$' + parseFloat(visit.cart_total || 0).toFixed(2)
                    )
                  )
                )
          )
        )
      )
    )
  );
}`,
        'js',
        'admin',
        0
      ]
    });
    console.log('   ✅ Admin page added\n');

    // 5. Update cart.viewed event to track visits
    console.log('5️⃣ Updating cart.viewed event...');
    await sequelize.query(`
      UPDATE plugin_events
      SET listener_function = $1
      WHERE plugin_id = $2 AND event_name = 'cart.viewed'
    `, {
      bind: [
        `export default async function onCartViewed(data) {
  console.log('👋 Cart Hamid Plugin: Cart viewed!', data);

  // Track visit to database
  try {
    const visitData = {
      session_id: data.sessionId || 'unknown',
      user_id: data.userId || null,
      cart_items_count: data.items?.length || 0,
      cart_subtotal: data.subtotal || 0,
      cart_total: data.total || 0,
      user_agent: navigator?.userAgent || null,
      referrer_url: document?.referrer || null
    };

    await fetch('/api/plugins/cart-hamid/track-visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(visitData)
    });

    console.log('✅ Cart visit tracked to database');
  } catch (error) {
    console.error('❌ Error tracking cart visit:', error);
  }

  // Show alert with utilities
  const utils = window.CartHamidUtils;
  const itemCount = data?.items?.length || 0;
  const total = data?.total || 0;

  setTimeout(() => {
    const greeting = utils ? utils.getGreeting() : 'Hello';
    const itemText = utils ? utils.formatItemCount(itemCount) : itemCount + ' items';
    const totalText = utils ? utils.formatCurrency(total) : '$' + total.toFixed(2);

    alert(
      greeting + ', Hamid! 👋\\n' +
      '===================\\n\\n' +
      'Cart visit tracked to database!\\n\\n' +
      '🛒 ' + itemText + '\\n' +
      '💳 Total: ' + totalText + '\\n\\n' +
      'Check the admin panel! 📊'
    );
  }, 500);
}`,
        PLUGIN_ID
      ]
    });
    console.log('   ✅ Event updated\n');

    // 6. Update plugin manifest with adminNavigation
    console.log('6️⃣ Updating plugin manifest...');
    await sequelize.query(`
      UPDATE plugin_registry
      SET manifest = jsonb_set(
        COALESCE(manifest, '{}'::jsonb),
        '{adminNavigation}',
        $1::jsonb
      )
      WHERE id = $2
    `, {
      bind: [
        JSON.stringify({
          enabled: true,
          label: 'Cart Visits',
          route: '/admin/cart-visits',
          icon: 'BarChart3',
          parentKey: null,
          order: 50,
          description: 'View cart visit analytics'
        }),
        PLUGIN_ID
      ]
    });
    console.log('   ✅ Manifest updated\n');

    console.log('✅ Cart Hamid Plugin successfully extended!');
    console.log('\n📋 Summary:');
    console.log('   - Database migration script added');
    console.log('   - Sequelize model added');
    console.log('   - API controller added');
    console.log('   - Admin page component added');
    console.log('   - cart.viewed event updated');
    console.log('   - Admin navigation link added');
    console.log('\n🚀 Next steps:');
    console.log('   1. Run the migration to create hamid_cart table');
    console.log('   2. Create API routes in backend');
    console.log('   3. Register admin page route in frontend');
    console.log('   4. Test by visiting /cart page');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

extendCartHamidPlugin();
