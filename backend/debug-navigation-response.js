// Debug the exact navigation response
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { sequelize } = require('./src/database/connection');
const AdminNavigationService = require('./src/services/AdminNavigationService');

async function debugNavigation() {
  try {
    console.log('🔍 Testing navigation service...\n');

    const navigation = await AdminNavigationService.getNavigationForTenant('default-tenant');

    console.log('✅ Navigation loaded');
    console.log('Top-level items:', navigation.length);
    console.log('\n📋 Full navigation structure:\n');
    console.log(JSON.stringify(navigation, null, 2));

    // Check for common issues
    console.log('\n🔍 Checking for issues...\n');

    let hasIssues = false;

    navigation.forEach((item, index) => {
      // Check for missing keys
      if (!item.key) {
        console.error(`❌ Item ${index} missing key:`, item);
        hasIssues = true;
      }

      // Check for missing labels
      if (!item.label) {
        console.error(`❌ Item ${item.key} missing label`);
        hasIssues = true;
      }

      // Check for missing icons
      if (!item.icon) {
        console.warn(`⚠️  Item ${item.key} missing icon`);
      }

      // Check children
      if (item.children) {
        item.children.forEach((child, childIndex) => {
          if (!child.key) {
            console.error(`❌ Child ${childIndex} of ${item.key} missing key`);
            hasIssues = true;
          }
          if (!child.label) {
            console.error(`❌ Child ${child.key} missing label`);
            hasIssues = true;
          }
        });
      }
    });

    if (!hasIssues) {
      console.log('✅ No data issues found');
    }

    // Sample what frontend would receive
    console.log('\n📦 Sample API response structure:');
    console.log(JSON.stringify({
      success: true,
      navigation: navigation
    }, null, 2).substring(0, 500) + '...');

  } catch (error) {
    console.error('❌ Error:', error);
    console.error(error.stack);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

debugNavigation();
