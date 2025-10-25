# Backend Scripts

Utility scripts for database maintenance, translations, and data management.

## Translation Scripts

### Create Missing NL Product Translations

Automatically translates all products from English to Dutch using Claude AI.

**File:** `create-missing-nl-product-translations.js`

**Usage:**

```bash
# Translate all products in all stores
node backend/src/scripts/create-missing-nl-product-translations.js

# Translate products for a specific store
node backend/src/scripts/create-missing-nl-product-translations.js STORE_UUID_HERE
```

**What it does:**
1. Queries the database for products with EN translations but missing NL translations
2. Uses Claude AI to translate product names, descriptions, and short descriptions
3. Inserts the NL translations into the `product_translations` table
4. Shows progress and error reporting

**Requirements:**
- `ANTHROPIC_API_KEY` must be set in your environment variables
- Database connection configured in `backend/src/database/connection.js`
- Products must have existing English translations

**Example output:**
```
🔄 Starting NL translations creation process...

📋 Executing query to find products...
📦 Found 50 total products

🔍 Products missing NL translations: 25

Products to translate:
  - SKU001: "Wireless Headphones"
  - SKU002: "Smart Watch"
  - SKU003: "Laptop Stand"
  - SKU004: "USB-C Cable"
  - SKU005: "Phone Case"
  ... and 20 more

🔄 Translating: SKU001 - "Wireless Headphones"
   ✅ Translated successfully: "Draadloze Koptelefoon"
🔄 Translating: SKU002 - "Smart Watch"
   ✅ Translated successfully: "Slimme Horloge"
...

============================================================
📊 Translation Results:
============================================================
Total products checked: 50
Products needing NL: 25
Successfully translated: 24
Failed: 1
============================================================
```

**Notes:**
- The script uses `ON CONFLICT DO UPDATE` so it's safe to re-run
- Existing NL translations will NOT be overwritten
- Failed translations are logged but don't stop the script
- Uses Claude AI with e-commerce context for better translations

## Running Scripts on Render.com

If your database is on Render.com, you'll need to run the script from the Render shell:

1. Go to your Render dashboard
2. Select your backend service
3. Click "Shell" tab
4. Run the script:
   ```bash
   node backend/src/scripts/create-missing-nl-product-translations.js
   ```

## Future Scripts

Add more scripts here for:
- Category translations
- CMS page translations
- CMS block translations
- Bulk product updates
- Database maintenance
