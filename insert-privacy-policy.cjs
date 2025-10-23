// Generate SQL to insert Privacy Policy page for Hamid store
const storeId = '157d4590-49bf-4b0b-bd77-abe131909528';
const storeName = 'Hamid';

// Import the privacy policy content
const {
  defaultPrivacyPolicyContent,
  defaultPrivacyPolicyMetadata,
  defaultPrivacyPolicyContentNL,
  defaultPrivacyPolicyMetadataNL
} = require('./backend/src/utils/defaultPrivacyPolicyContent');

// Replace store name placeholders
const enContent = defaultPrivacyPolicyContent.replace(/{{store_name}}/g, storeName);
const nlContent = defaultPrivacyPolicyContentNL.replace(/{{store_name}}/g, storeName);
const metaTitle = defaultPrivacyPolicyMetadata.meta_title.replace(/{{store_name}}/g, storeName);
const metaDescription = defaultPrivacyPolicyMetadata.meta_description.replace(/{{store_name}}/g, storeName);
const metaTitleNL = defaultPrivacyPolicyMetadataNL.meta_title.replace(/{{store_name}}/g, storeName);
const metaDescriptionNL = defaultPrivacyPolicyMetadataNL.meta_description.replace(/{{store_name}}/g, storeName);

// Create the translations object
const translations = {
  en: {
    title: 'Privacy Policy',
    content: enContent.trim()
  },
  nl: {
    title: 'Privacybeleid',
    content: nlContent.trim()
  }
};

// Generate SQL using PostgreSQL's dollar-quoted strings for easier escaping
const jsonString = JSON.stringify(translations);

const sql = `INSERT INTO cms_pages (
  id,
  store_id,
  slug,
  is_active,
  is_system,
  meta_title,
  meta_description,
  meta_keywords,
  meta_robots_tag,
  sort_order,
  translations,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '${storeId}',
  'privacy-policy',
  true,
  true,
  '${metaTitle}',
  '${metaDescription}',
  '${defaultPrivacyPolicyMetadata.meta_keywords}',
  '${defaultPrivacyPolicyMetadata.meta_robots_tag}',
  9998,
  $$${jsonString}$$::jsonb,
  NOW(),
  NOW()
);`;

console.log(sql);
