#!/usr/bin/env node
/**
 * Test API translation response structure
 */

(async () => {
  const fetch = (await import('node-fetch')).default;
  try {
    const response = await fetch('https://catalyst-backend-fzhu.onrender.com/api/translations/ui-labels?lang=en');
    const result = await response.json();

    console.log('\n📦 API Response structure:');
    console.log('  success:', result.success);
    console.log('  data.language:', result.data?.language);
    console.log('  data.labels type:', typeof result.data?.labels);

    const labels = result.data?.labels || {};
    const labelKeys = Object.keys(labels);

    console.log('  data.labels keys:', labelKeys.slice(0, 10));

    console.log('\n🔍 Checking common translations:');
    console.log('  labels.common exists:', !!labels.common);

    if (labels.common) {
      const commonKeys = Object.keys(labels.common);
      console.log('  labels.common type:', typeof labels.common);
      console.log('  labels.common keys count:', commonKeys.length);
      console.log('  labels.common.welcome_back:', labels.common.welcome_back);
      console.log('  labels.common.create_account:', labels.common.create_account);
      console.log('  labels.common.already_registered_login:', labels.common.already_registered_login);
      console.log('  First 10 common keys:', commonKeys.slice(0, 10));
    } else {
      console.log('  ❌ labels.common does not exist!');
      console.log('  Available top-level keys:', labelKeys);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
})();
