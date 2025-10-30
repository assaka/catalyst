// Validate hook syntax
require('dotenv').config();
const { sequelize } = require('./src/database/connection');

const PLUGIN_ID = '4eb11832-5429-4146-af06-de86d319a0e5';

async function validateHookSyntax() {
  try {
    console.log('🔍 Validating hook syntax...\n');

    const hooks = await sequelize.query(`
      SELECT hook_name, handler_function
      FROM plugin_hooks
      WHERE plugin_id = $1
    `, {
      bind: [PLUGIN_ID],
      type: sequelize.QueryTypes.SELECT
    });

    console.log(`Found ${hooks.length} hook(s)\n`);

    for (const hook of hooks) {
      console.log(`\n📝 Validating: ${hook.hook_name}`);
      console.log('─'.repeat(60));

      // Try to create a function from the code
      try {
        let code = hook.handler_function.trim();

        // Show first 200 chars
        console.log('First 200 chars:');
        console.log(code.substring(0, 200));
        console.log('...\n');

        // Try to evaluate it as a function
        const fn = eval(`(${code})`);

        if (typeof fn === 'function') {
          console.log('✅ Valid function!');
          console.log(`   Function length: ${fn.length} parameters`);
          console.log(`   Code size: ${code.length} chars`);
        } else {
          console.log('❌ Not a function! Type:', typeof fn);
        }

      } catch (error) {
        console.log('❌ SYNTAX ERROR!');
        console.log('   Error:', error.message);
        console.log('   This hook will fail to load on the frontend!');

        // Show problematic section
        if (error.message.includes('line')) {
          console.log('\n🔍 Error details:');
          const lines = hook.handler_function.split('\n');
          const errorLine = parseInt(error.message.match(/line (\d+)/)?.[1] || 0);
          if (errorLine > 0) {
            console.log(`   Line ${errorLine}:`, lines[errorLine - 1]);
          }
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('Validation complete!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

validateHookSyntax();
