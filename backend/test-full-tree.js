require('dotenv').config();
const AdminNavigationService = require('./src/services/AdminNavigationService');

async function testFullTree() {
  try {
    const navigation = await AdminNavigationService.getNavigationForTenant('default-tenant');

    console.log('\n=== FULL NAVIGATION TREE ===\n');

    function printTree(items, depth = 0) {
      items.forEach(item => {
        const indent = '  '.repeat(depth);
        console.log(`${indent}- ${item.label} (${item.key})${item.children && item.children.length > 0 ? ` [${item.children.length} children]` : ''}`);
        if (item.children && item.children.length > 0) {
          printTree(item.children, depth + 1);
        }
      });
    }

    printTree(navigation);

    console.log('\n✅ Complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testFullTree();
