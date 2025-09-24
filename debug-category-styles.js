// Debug script to check specific configuration ID from the debug output
console.log('🔍 Checking database for specific configuration...');

// Function to check the specific configuration we saw in debug
function checkSpecificConfig() {
  // This should be called from browser console where supabase client is available
  if (typeof window !== 'undefined') {
    console.log('Run this in browser console:');
    console.log(`
// Check specific configuration
const storeId = '157d4590-49bf-4b0b-bd77-abe131909528';
const configId = 'fce16eb1-45a8-4806-8fa1-b87cc3f4d075';

// You can run this in browser dev tools console where supabase is available:
// First ensure you have access to the supabase client in your app
console.log('Checking configuration:', configId);
console.log('For store:', storeId);
console.log('Expected to find coral or green color for category_title slot');
`);
  }
}

checkSpecificConfig();

// Helper to add to browser console for direct database check
const browserDebugScript = `
// Run this in browser console to check the specific configuration
async function checkCategoryTitleColor() {
  try {
    // This assumes your app has supabase client available globally
    // You might need to adapt this to access your app's supabase instance

    const configId = 'fce16eb1-45a8-4806-8fa1-b87cc3f4d075';

    console.log('🔍 Fetching configuration from database...');

    // You would need to access your app's supabase client here
    // const result = await supabaseClient.from('slot_configurations').select('*').eq('id', configId).single();

    console.log('To check the database, inspect the Network tab when loading the category editor');
    console.log('Look for a request to slot_configurations or getDraftConfiguration');
    console.log('Configuration ID to look for:', configId);

    return configId;
  } catch (error) {
    console.error('Error:', error);
  }
}

checkCategoryTitleColor();
`;

console.log('Browser debug script:');
console.log(browserDebugScript);