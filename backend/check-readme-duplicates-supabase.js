// Check for duplicate README.md using Supabase directly
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const PLUGIN_ID = 'eea24e22-7bc7-457e-8403-df53758ebf76';

async function checkReadmeDuplicates() {
  try {
    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Supabase credentials missing');
      process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🔍 Checking all locations for README.md...\n');
    console.log(`Plugin ID: ${PLUGIN_ID}\n`);

    // Check plugin_scripts
    console.log('📄 plugin_scripts:');
    const { data: scripts, error: scriptsError } = await supabase
      .from('plugin_scripts')
      .select('id, file_name, scope')
      .eq('plugin_id', PLUGIN_ID)
      .ilike('file_name', '%README%');

    if (scriptsError) {
      console.log('   ❌ Error:', scriptsError.message);
    } else {
      console.log(`   Found ${scripts.length} README file(s)`);
      scripts.forEach(s => console.log(`   - ${s.file_name} (scope: ${s.scope}) [ID: ${s.id}]`));
    }

    // Check plugin_docs
    console.log('\n📚 plugin_docs:');
    const { data: docs, error: docsError } = await supabase
      .from('plugin_docs')
      .select('id, doc_type, file_name')
      .eq('plugin_id', PLUGIN_ID)
      .eq('doc_type', 'readme');

    if (docsError) {
      console.log('   ❌ Error:', docsError.message);
    } else {
      console.log(`   Found ${docs.length} README file(s)`);
      docs.forEach(d => console.log(`   - ${d.file_name} (doc_type: ${d.doc_type}) [ID: ${d.id}]`));
    }

    // Check manifest
    console.log('\n📦 plugin_registry.manifest:');
    const { data: plugin, error: pluginError } = await supabase
      .from('plugin_registry')
      .select('manifest')
      .eq('id', PLUGIN_ID)
      .single();

    if (pluginError) {
      console.log('   ❌ Error:', pluginError.message);
    } else if (plugin && plugin.manifest) {
      if (plugin.manifest.readme) {
        console.log('   ⚠️  manifest.readme field exists (should be removed)');
      } else {
        console.log('   ✅ No readme field in manifest');
      }
      if (plugin.manifest.generatedFiles) {
        const readmeInGenerated = plugin.manifest.generatedFiles.filter(f =>
          (f.name || '').includes('README')
        );
        if (readmeInGenerated.length > 0) {
          console.log(`   ⚠️  Found ${readmeInGenerated.length} README in manifest.generatedFiles`);
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Summary:');
    const totalReadmes = (scripts?.length || 0) + (docs?.length || 0);
    console.log(`   Total README files: ${totalReadmes}`);

    if (totalReadmes > 1) {
      console.log('\n⚠️  DUPLICATES FOUND! Should only have 1 README in plugin_docs');
      console.log('\n🔧 To fix:');
      if (scripts && scripts.length > 0) {
        console.log('   1. Delete from plugin_scripts');
        scripts.forEach(s => {
          console.log(`      DELETE FROM plugin_scripts WHERE id = '${s.id}';`);
        });
      }
      console.log('   2. Keep only in plugin_docs');
    } else if (totalReadmes === 0) {
      console.log('   ℹ️  No README found');
    } else {
      console.log('   ✅ Correct! Only 1 README in the right place');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

checkReadmeDuplicates();
