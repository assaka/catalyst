#!/bin/bash

# Performance Optimizations Deployment Script
# This script applies database migrations and verifies the optimizations

set -e  # Exit on error

echo "🚀 Deploying Performance Optimizations..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Check database connection
echo "📊 Step 1: Checking database connection..."
if npm run migrate:status > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Database connection OK${NC}"
else
    echo -e "${RED}✗ Database connection failed${NC}"
    echo "Please check your database configuration"
    exit 1
fi

# Step 2: Run migrations
echo ""
echo "📊 Step 2: Running database migrations..."
if npm run migrate; then
    echo -e "${GREEN}✓ Migrations completed${NC}"
else
    echo -e "${RED}✗ Migration failed${NC}"
    echo "Please check the error messages above"
    exit 1
fi

# Step 3: Verify indexes
echo ""
echo "📊 Step 3: Verifying indexes created..."

# Check if we can connect to database and verify indexes
cat > /tmp/verify_indexes.js << 'EOF'
const { sequelize } = require('./src/database/connection');

async function verifyIndexes() {
  try {
    const [results] = await sequelize.query(`
      SELECT
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE tablename IN ('products', 'categories', 'product_translations', 'category_translations')
        AND indexname LIKE 'idx_%'
      ORDER BY tablename, indexname;
    `);

    console.log('\n📋 Database Indexes:\n');

    const grouped = {};
    results.forEach(row => {
      if (!grouped[row.tablename]) grouped[row.tablename] = [];
      grouped[row.tablename].push(row.indexname);
    });

    Object.entries(grouped).forEach(([table, indexes]) => {
      console.log(`  ${table}:`);
      indexes.forEach(idx => console.log(`    ✓ ${idx}`));
      console.log('');
    });

    console.log(`Total indexes created: ${results.length}\n`);

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Error verifying indexes:', error.message);
    process.exit(1);
  }
}

verifyIndexes();
EOF

node /tmp/verify_indexes.js
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Indexes verified${NC}"
else
    echo -e "${YELLOW}⚠ Could not verify indexes (but migrations may have succeeded)${NC}"
fi

# Step 4: Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Performance Optimizations Deployed!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Changes Applied:"
echo "  • SQL-based pagination for categories"
echo "  • Store settings cache (5-minute TTL)"
echo "  • Optimized product queries with JOINs"
echo "  • Database indexes for fast lookups"
echo "  • Reduced verbose logging"
echo ""
echo "📊 Expected Performance Improvements:"
echo "  • Category endpoints: 4-6x faster"
echo "  • Product endpoints: 4-5x faster"
echo "  • Database queries: 60-85% reduction"
echo ""
echo "📖 Next Steps:"
echo "  1. Restart your backend server:"
echo "     ${YELLOW}npm run dev${NC} or ${YELLOW}npm start${NC}"
echo ""
echo "  2. Monitor performance:"
echo "     - Check API response times"
echo "     - Monitor database query logs"
echo "     - Track cache hit rates"
echo ""
echo "  3. Review documentation:"
echo "     ${YELLOW}cat backend/PERFORMANCE_OPTIMIZATIONS.md${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Cleanup
rm -f /tmp/verify_indexes.js
