/**
 * Extract Supabase credentials from MASTER_DB_URL
 */

require('dotenv').config();

const masterDbUrl = process.env.MASTER_DB_URL;

if (!masterDbUrl) {
  console.error('❌ MASTER_DB_URL not found in .env');
  process.exit(1);
}

console.log('🔍 Parsing MASTER_DB_URL...\n');

// Parse: postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres
const urlMatch = masterDbUrl.match(/postgres\.([^:]+):([^@]+)@aws-0-([^.]+)\.pooler\.supabase\.co/);

if (urlMatch) {
  const [, projectRef, password, region] = urlMatch;
  const supabaseUrl = `https://${projectRef}.supabase.co`;

  console.log('✅ Extracted Supabase connection details:');
  console.log('=' .repeat(70));
  console.log(`Project Reference: ${projectRef}`);
  console.log(`Region: ${region}`);
  console.log(`Supabase URL: ${supabaseUrl}`);
  console.log(`Password (first 10 chars): ${password.substring(0, 10)}...`);
  console.log('\n⚠️  You need the SERVICE ROLE KEY (not the password)');
  console.log('   Go to: https://supabase.com/dashboard/project/' + projectRef + '/settings/api');
  console.log('   Copy the "service_role" key (NOT the anon key)');
  console.log('\nThen add to backend/.env:');
  console.log(`MASTER_SUPABASE_URL=${supabaseUrl}`);
  console.log(`MASTER_SUPABASE_SERVICE_KEY=your-service-role-key-here`);
  console.log('=' .repeat(70));
} else {
  console.error('❌ Could not parse MASTER_DB_URL format');
  console.log('Expected format: postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres');
}
