// Add hamid_cart entity and controllers to Cart Hamid plugin
require('dotenv').config();
const { sequelize } = require('./src/database/connection');

const PLUGIN_ID = '109c940f-5d33-472c-b7df-c48e68c35696';

async function addEntityAndControllers() {
  try {
    console.log('🚀 Adding hamid_cart entity and controllers to Cart Hamid plugin...\n');

    // 1. Add hamid_cart entity
    console.log('1️⃣ Adding hamid_cart entity...');

    const schemaDefinition = {
      columns: [
        {
          name: 'id',
          type: 'UUID',
          primaryKey: true,
          default: 'gen_random_uuid()',
          comment: 'Primary key'
        },
        {
          name: 'user_id',
          type: 'UUID',
          nullable: true,
          comment: 'Reference to authenticated user (nullable)'
        },
        {
          name: 'session_id',
          type: 'VARCHAR(255)',
          nullable: true,
          comment: 'Session identifier for anonymous users'
        },
        {
          name: 'cart_items_count',
          type: 'INTEGER',
          default: 0,
          comment: 'Number of items in cart at visit time'
        },
        {
          name: 'cart_subtotal',
          type: 'DECIMAL(10, 2)',
          default: 0.00,
          comment: 'Cart subtotal at visit time'
        },
        {
          name: 'cart_total',
          type: 'DECIMAL(10, 2)',
          default: 0.00,
          comment: 'Cart total at visit time'
        },
        {
          name: 'user_agent',
          type: 'TEXT',
          nullable: true,
          comment: 'Browser/device information'
        },
        {
          name: 'ip_address',
          type: 'VARCHAR(45)',
          nullable: true,
          comment: 'IPv4 or IPv6 address'
        },
        {
          name: 'referrer_url',
          type: 'TEXT',
          nullable: true,
          comment: 'URL the user came from'
        },
        {
          name: 'visited_at',
          type: 'TIMESTAMP WITH TIME ZONE',
          default: 'NOW()',
          comment: 'Timestamp of cart visit'
        },
        {
          name: 'created_at',
          type: 'TIMESTAMP WITH TIME ZONE',
          default: 'NOW()',
          comment: 'Record creation timestamp'
        }
      ],
      indexes: [
        {
          name: 'idx_hamid_cart_user',
          columns: ['user_id']
        },
        {
          name: 'idx_hamid_cart_session',
          columns: ['session_id']
        },
        {
          name: 'idx_hamid_cart_visited_at',
          columns: ['visited_at'],
          order: 'DESC'
        },
        {
          name: 'idx_hamid_cart_created_at',
          columns: ['created_at'],
          order: 'DESC'
        }
      ],
      foreignKeys: []
    };

    // Generate CREATE TABLE SQL
    const createTableSQL = generateCreateTableSQL('hamid_cart', schemaDefinition);
    const dropTableSQL = 'DROP TABLE IF EXISTS hamid_cart CASCADE;';

    await sequelize.query(`
      INSERT INTO plugin_entities (
        plugin_id, entity_name, table_name, description,
        schema_definition, create_table_sql, drop_table_sql,
        migration_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (plugin_id, entity_name) DO UPDATE
      SET schema_definition = EXCLUDED.schema_definition,
          create_table_sql = EXCLUDED.create_table_sql,
          updated_at = NOW()
    `, {
      bind: [
        PLUGIN_ID,
        'HamidCart',
        'hamid_cart',
        'Tracks cart page visits for analytics',
        JSON.stringify(schemaDefinition),
        createTableSQL,
        dropTableSQL,
        'migrated'  // Already created via migration
      ]
    });

    console.log('   ✅ hamid_cart entity added\n');

    // 2. Add track-visit controller
    console.log('2️⃣ Adding track-visit controller...');

    await sequelize.query(`
      INSERT INTO plugin_controllers (
        plugin_id, controller_name, description, method, path, handler_code, requires_auth
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (plugin_id, method, path) DO UPDATE
      SET handler_code = EXCLUDED.handler_code,
          updated_at = NOW()
    `, {
      bind: [
        PLUGIN_ID,
        'trackVisit',
        'Track a cart page visit',
        'POST',
        '/track-visit',
        `async function trackVisit(req, res, { sequelize }) {
  const {
    user_id,
    session_id,
    cart_items_count,
    cart_subtotal,
    cart_total,
    user_agent,
    referrer_url
  } = req.body;

  const result = await sequelize.query(\`
    INSERT INTO hamid_cart (
      user_id, session_id, cart_items_count,
      cart_subtotal, cart_total, user_agent,
      ip_address, referrer_url
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  \`, {
    bind: [
      user_id || null,
      session_id || null,
      cart_items_count || 0,
      cart_subtotal || 0,
      cart_total || 0,
      user_agent || null,
      req.ip || null,
      referrer_url || null
    ],
    type: sequelize.QueryTypes.INSERT
  });

  return res.json({ success: true, visit: result[0][0] });
}`,
        false
      ]
    });

    console.log('   ✅ track-visit controller added\n');

    // 3. Add get-visits controller
    console.log('3️⃣ Adding get-visits controller...');

    await sequelize.query(`
      INSERT INTO plugin_controllers (
        plugin_id, controller_name, description, method, path, handler_code, requires_auth
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (plugin_id, method, path) DO UPDATE
      SET handler_code = EXCLUDED.handler_code,
          updated_at = NOW()
    `, {
      bind: [
        PLUGIN_ID,
        'getVisits',
        'Get all cart visits with pagination',
        'GET',
        '/visits',
        `async function getVisits(req, res, { sequelize }) {
  const limit = parseInt(req.query.limit) || 50;
  const offset = parseInt(req.query.offset) || 0;

  const visits = await sequelize.query(\`
    SELECT * FROM hamid_cart
    ORDER BY visited_at DESC
    LIMIT $1 OFFSET $2
  \`, {
    bind: [limit, offset],
    type: sequelize.QueryTypes.SELECT
  });

  const countResult = await sequelize.query(\`
    SELECT COUNT(*) as total FROM hamid_cart
  \`, {
    type: sequelize.QueryTypes.SELECT
  });

  const total = parseInt(countResult[0].total || countResult[0].count || 0);

  return res.json({
    success: true,
    visits,
    total,
    limit,
    offset
  });
}`,
        false
      ]
    });

    console.log('   ✅ get-visits controller added\n');

    // 4. Add get-stats controller
    console.log('4️⃣ Adding get-stats controller...');

    await sequelize.query(`
      INSERT INTO plugin_controllers (
        plugin_id, controller_name, description, method, path, handler_code, requires_auth
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (plugin_id, method, path) DO UPDATE
      SET handler_code = EXCLUDED.handler_code,
          updated_at = NOW()
    `, {
      bind: [
        PLUGIN_ID,
        'getStats',
        'Get cart visit statistics',
        'GET',
        '/stats',
        `async function getStats(req, res, { sequelize }) {
  const stats = await sequelize.query(\`
    SELECT
      COUNT(*) as total_visits,
      COUNT(DISTINCT user_id) as unique_users,
      COUNT(DISTINCT session_id) as unique_sessions,
      AVG(cart_items_count) as avg_items,
      AVG(cart_total) as avg_total,
      MAX(visited_at) as last_visit
    FROM hamid_cart
  \`, {
    type: sequelize.QueryTypes.SELECT
  });

  return res.json({
    success: true,
    ...stats[0]
  });
}`,
        false
      ]
    });

    console.log('   ✅ get-stats controller added\n');

    console.log('✅ Cart Hamid plugin extended with entity and controllers!\n');
    console.log('📋 Summary:');
    console.log('   Entity: hamid_cart (HamidCart)');
    console.log('   Controllers:');
    console.log('     - POST /api/plugins/cart-hamid/track-visit');
    console.log('     - GET  /api/plugins/cart-hamid/visits');
    console.log('     - GET  /api/plugins/cart-hamid/stats');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Helper function to generate CREATE TABLE SQL from schema definition
function generateCreateTableSQL(tableName, schema) {
  let sql = `CREATE TABLE IF NOT EXISTS ${tableName} (\n`;

  // Add columns
  const columnDefs = schema.columns.map(col => {
    let def = `  ${col.name} ${col.type}`;
    if (col.primaryKey) def += ' PRIMARY KEY';
    if (col.default) def += ` DEFAULT ${col.default}`;
    if (col.nullable === false) def += ' NOT NULL';
    return def;
  });

  sql += columnDefs.join(',\n');
  sql += '\n);\n\n';

  // Add indexes
  if (schema.indexes && schema.indexes.length > 0) {
    schema.indexes.forEach(idx => {
      const columns = idx.columns.join(', ');
      const order = idx.order ? ` ${idx.order}` : '';
      sql += `CREATE INDEX IF NOT EXISTS ${idx.name} ON ${tableName}(${columns}${order});\n`;
    });
    sql += '\n';
  }

  // Add comment
  sql += `COMMENT ON TABLE ${tableName} IS 'Tracks cart page visits for analytics (Cart Hamid Plugin)';`;

  return sql;
}

addEntityAndControllers();
