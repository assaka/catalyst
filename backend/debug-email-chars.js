#!/usr/bin/env node

const { sequelize } = require('./src/database/connection');

async function debugEmailChars() {
  try {
    console.log('🔍 Debugging email character encoding...');
    
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    // Get all users and analyze their emails character by character
    const allUsers = await sequelize.query(
      'SELECT email, LENGTH(email) as email_length FROM users ORDER BY created_at DESC',
      { type: sequelize.QueryTypes.SELECT }
    );
    
    console.log('\n📧 Email analysis:');
    allUsers.forEach((user, index) => {
      console.log(`\n${index + 1}. Email: "${user.email}"`);
      console.log(`   Length: ${user.email_length}`);
      console.log(`   ASCII codes:`, Array.from(user.email).map(char => `${char}(${char.charCodeAt(0)})`).join(' '));
      
      // Check for common issues
      if (user.email.includes(' ')) {
        console.log('   ⚠️  Contains spaces!');
      }
      if (user.email !== user.email.trim()) {
        console.log('   ⚠️  Has leading/trailing whitespace!');
      }
      if (user.email.includes('\n') || user.email.includes('\r')) {
        console.log('   ⚠️  Contains newline characters!');
      }
    });
    
    // Test exact match queries
    const testEmail = 'playamin998@gmail.com';
    console.log(`\n🔍 Testing exact match for: "${testEmail}"`);
    
    // Query 1: Exact match
    const result1 = await sequelize.query(
      'SELECT COUNT(*) as count FROM users WHERE email = :email',
      { 
        replacements: { email: testEmail },
        type: sequelize.QueryTypes.SELECT 
      }
    );
    console.log(`Exact match count: ${result1[0].count}`);
    
    // Query 2: Case insensitive match
    const result2 = await sequelize.query(
      'SELECT COUNT(*) as count FROM users WHERE LOWER(email) = LOWER(:email)',
      { 
        replacements: { email: testEmail },
        type: sequelize.QueryTypes.SELECT 
      }
    );
    console.log(`Case insensitive match count: ${result2[0].count}`);
    
    // Query 3: Trim and match
    const result3 = await sequelize.query(
      'SELECT COUNT(*) as count FROM users WHERE TRIM(email) = :email',
      { 
        replacements: { email: testEmail },
        type: sequelize.QueryTypes.SELECT 
      }
    );
    console.log(`Trimmed match count: ${result3[0].count}`);
    
    // Query 4: Show actual stored email with hex encoding
    const result4 = await sequelize.query(
      "SELECT email, encode(email::bytea, 'hex') as email_hex FROM users WHERE email LIKE '%playamin%'",
      { type: sequelize.QueryTypes.SELECT }
    );
    
    if (result4.length > 0) {
      console.log(`\n🔬 Hex analysis of stored email:`);
      console.log(`Email: "${result4[0].email}"`);
      console.log(`Hex: ${result4[0].email_hex}`);
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  } finally {
    await sequelize.close();
  }
}

debugEmailChars();