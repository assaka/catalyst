#!/usr/bin/env node

/**
 * Seed Default Languages
 *
 * This script populates the languages table with common languages.
 *
 * Usage:
 *   NODE_ENV=production DATABASE_URL="your_db_url" node scripts/seed-default-languages.js
 */

require('dotenv').config();
const { sequelize } = require('../src/database/connection');

const defaultLanguages = [
  // English - Default
  {
    code: 'en',
    name: 'English',
    native_name: 'English',
    is_active: true,
    is_rtl: false
  },
  // Spanish
  {
    code: 'es',
    name: 'Spanish',
    native_name: 'Español',
    is_active: false,
    is_rtl: false
  },
  // French
  {
    code: 'fr',
    name: 'French',
    native_name: 'Français',
    is_active: false,
    is_rtl: false
  },
  // German
  {
    code: 'de',
    name: 'German',
    native_name: 'Deutsch',
    is_active: false,
    is_rtl: false
  },
  // Italian
  {
    code: 'it',
    name: 'Italian',
    native_name: 'Italiano',
    is_active: false,
    is_rtl: false
  },
  // Portuguese
  {
    code: 'pt',
    name: 'Portuguese',
    native_name: 'Português',
    is_active: false,
    is_rtl: false
  },
  // Dutch
  {
    code: 'nl',
    name: 'Dutch',
    native_name: 'Nederlands',
    is_active: true,  // Active for your use case
    is_rtl: false
  },
  // Arabic
  {
    code: 'ar',
    name: 'Arabic',
    native_name: 'العربية',
    is_active: false,
    is_rtl: true
  },
  // Hebrew
  {
    code: 'he',
    name: 'Hebrew',
    native_name: 'עברית',
    is_active: false,
    is_rtl: true
  },
  // Chinese (Simplified)
  {
    code: 'zh',
    name: 'Chinese',
    native_name: '中文',
    is_active: false,
    is_rtl: false
  },
  // Japanese
  {
    code: 'ja',
    name: 'Japanese',
    native_name: '日本語',
    is_active: false,
    is_rtl: false
  },
  // Korean
  {
    code: 'ko',
    name: 'Korean',
    native_name: '한국어',
    is_active: false,
    is_rtl: false
  },
  // Russian
  {
    code: 'ru',
    name: 'Russian',
    native_name: 'Русский',
    is_active: false,
    is_rtl: false
  },
  // Polish
  {
    code: 'pl',
    name: 'Polish',
    native_name: 'Polski',
    is_active: false,
    is_rtl: false
  },
  // Turkish
  {
    code: 'tr',
    name: 'Turkish',
    native_name: 'Türkçe',
    is_active: false,
    is_rtl: false
  }
];

async function seedLanguages() {
  console.log('🌐 Seeding Default Languages\n');

  try {
    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    // Check if languages already exist
    const [existing] = await sequelize.query('SELECT COUNT(*) as count FROM languages');
    if (existing[0].count > 0) {
      console.log(`⚠️  Found ${existing[0].count} existing languages`);
      console.log('   Skipping to avoid duplicates. Delete existing languages first if you want to re-seed.\n');
      await sequelize.close();
      process.exit(0);
    }

    console.log(`📝 Inserting ${defaultLanguages.length} languages...\n`);

    let inserted = 0;
    for (const lang of defaultLanguages) {
      await sequelize.query(`
        INSERT INTO languages (id, code, name, native_name, is_active, is_rtl, created_at, updated_at)
        VALUES (gen_random_uuid(), :code, :name, :native_name, :is_active, :is_rtl, NOW(), NOW())
        ON CONFLICT (code) DO UPDATE
        SET name = EXCLUDED.name,
            native_name = EXCLUDED.native_name,
            is_active = EXCLUDED.is_active,
            is_rtl = EXCLUDED.is_rtl,
            updated_at = NOW()
      `, {
        replacements: {
          code: lang.code,
          name: lang.name,
          native_name: lang.native_name,
          is_active: lang.is_active,
          is_rtl: lang.is_rtl
        }
      });

      inserted++;
      const status = lang.is_active ? '✅ ACTIVE' : '⚪ Inactive';
      const rtl = lang.is_rtl ? '(RTL)' : '';
      console.log(`  ${status} ${lang.code.toUpperCase().padEnd(3)} - ${lang.native_name} ${rtl}`);
    }

    console.log(`\n✅ Seeded ${inserted} languages!\n`);

    // Show active languages
    const [active] = await sequelize.query(`
      SELECT code, name, native_name, is_rtl
      FROM languages
      WHERE is_active = true
      ORDER BY name
    `);

    console.log('📋 Active languages:');
    active.forEach(l => {
      const rtl = l.is_rtl ? '(RTL)' : '';
      console.log(`   - ${l.code.toUpperCase()} - ${l.native_name} ${rtl}`);
    });

    console.log('\n💡 To activate more languages:');
    console.log('   1. Go to /admin/languages');
    console.log('   2. Toggle languages active/inactive');
    console.log('   3. Use AI translation to translate content\n');

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await sequelize.close();
    process.exit(1);
  }
}

seedLanguages();
