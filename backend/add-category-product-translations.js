/**
 * Add Dutch translations for categories and products
 * This script fetches actual categories and products from the database
 * and adds Dutch translations for them
 *
 * Run with: NODE_ENV=production DATABASE_URL="..." node backend/add-category-product-translations.js
 */

const { Translation, Category, Product } = require('./src/models');

// Common Dutch translations for category/product terms
const categoryTranslations = {
  // Example categories - these will be replaced with actual data from database
  'Electronics': 'Elektronica',
  'Clothing': 'Kleding',
  'Books': 'Boeken',
  'Home & Garden': 'Huis & Tuin',
  'Sports & Outdoors': 'Sport & Outdoor',
  'Toys & Games': 'Speelgoed & Spellen',
  'Health & Beauty': 'Gezondheid & Schoonheid',
  'Food & Beverages': 'Eten & Drinken',
  'Furniture': 'Meubels',
  'Appliances': 'Apparaten',
  'Computers': 'Computers',
  'Phones & Tablets': 'Telefoons & Tablets',
  'Cameras': 'Camera\'s',
  'Audio & Video': 'Audio & Video',
  'Men\'s Clothing': 'Herenkleding',
  'Women\'s Clothing': 'Dameskleding',
  'Kids\' Clothing': 'Kinderkleding',
  'Shoes': 'Schoenen',
  'Accessories': 'Accessoires',
  'Jewelry': 'Sieraden',
  'Watches': 'Horloges',
  'Bags': 'Tassen',
  'Kitchen': 'Keuken',
  'Bathroom': 'Badkamer',
  'Bedroom': 'Slaapkamer',
  'Living Room': 'Woonkamer',
  'Office': 'Kantoor',
  'Outdoor': 'Buiten',
  'Garden': 'Tuin',
  'Tools': 'Gereedschap',
};

// Common product-related terms for translation
const productTermTranslations = {
  'Laptop': 'Laptop',
  'Smartphone': 'Smartphone',
  'Tablet': 'Tablet',
  'Headphones': 'Koptelefoon',
  'Speaker': 'Luidspreker',
  'Camera': 'Camera',
  'Watch': 'Horloge',
  'Bag': 'Tas',
  'Backpack': 'Rugzak',
  'Wallet': 'Portemonnee',
  'Shoes': 'Schoenen',
  'Boots': 'Laarzen',
  'Sneakers': 'Sneakers',
  'Sandals': 'Sandalen',
  'Shirt': 'Shirt',
  'T-Shirt': 'T-Shirt',
  'Pants': 'Broek',
  'Jeans': 'Spijkerbroek',
  'Dress': 'Jurk',
  'Jacket': 'Jas',
  'Coat': 'Jas',
  'Sweater': 'Trui',
  'Hoodie': 'Hoodie',
  'Shorts': 'Korte broek',
  'Skirt': 'Rok',
  'Blouse': 'Blouse',
  'Suit': 'Pak',
  'Tie': 'Stropdas',
  'Belt': 'Riem',
  'Hat': 'Hoed',
  'Cap': 'Pet',
  'Gloves': 'Handschoenen',
  'Scarf': 'Sjaal',
  'Socks': 'Sokken',
  'Underwear': 'Ondergoed',
  'Swimsuit': 'Zwemkleding',
  'Sunglasses': 'Zonnebril',
  'Glasses': 'Bril',
  'Necklace': 'Ketting',
  'Bracelet': 'Armband',
  'Earrings': 'Oorbellen',
  'Ring': 'Ring',
  'Perfume': 'Parfum',
  'Cologne': 'Eau de Cologne',
  'Makeup': 'Make-up',
  'Lipstick': 'Lippenstift',
  'Foundation': 'Foundation',
  'Mascara': 'Mascara',
  'Shampoo': 'Shampoo',
  'Conditioner': 'Conditioner',
  'Soap': 'Zeep',
  'Toothpaste': 'Tandpasta',
  'Toothbrush': 'Tandenborstel',
  'Book': 'Boek',
  'Novel': 'Roman',
  'Magazine': 'Tijdschrift',
  'Newspaper': 'Krant',
  'Notebook': 'Notitieboek',
  'Pen': 'Pen',
  'Pencil': 'Potlood',
  'Eraser': 'Gum',
  'Ruler': 'Liniaal',
  'Backpack': 'Rugzak',
  'Desk': 'Bureau',
  'Chair': 'Stoel',
  'Table': 'Tafel',
  'Lamp': 'Lamp',
  'Bed': 'Bed',
  'Mattress': 'Matras',
  'Pillow': 'Kussen',
  'Blanket': 'Deken',
  'Towel': 'Handdoek',
  'Curtain': 'Gordijn',
  'Rug': 'Vloerkleed',
  'Mirror': 'Spiegel',
  'Clock': 'Klok',
  'Frame': 'Lijst',
  'Vase': 'Vaas',
  'Candle': 'Kaars',
  'Plant': 'Plant',
  'Pot': 'Pot',
  'Pan': 'Pan',
  'Knife': 'Mes',
  'Fork': 'Vork',
  'Spoon': 'Lepel',
  'Plate': 'Bord',
  'Bowl': 'Kom',
  'Cup': 'Kopje',
  'Glass': 'Glas',
  'Bottle': 'Fles',
  'Kettle': 'Waterkoker',
  'Blender': 'Blender',
  'Mixer': 'Mixer',
  'Toaster': 'Broodrooster',
  'Microwave': 'Magnetron',
  'Oven': 'Oven',
  'Refrigerator': 'Koelkast',
  'Freezer': 'Vriezer',
  'Dishwasher': 'Vaatwasser',
  'Washing Machine': 'Wasmachine',
  'Dryer': 'Droger',
  'Vacuum Cleaner': 'Stofzuiger',
  'Iron': 'Strijkijzer',
  'Fan': 'Ventilator',
  'Heater': 'Verwarming',
  'Air Conditioner': 'Airconditioning',
};

async function addCategoryTranslations() {
  console.log('🔄 Fetching categories from database...\n');

  try {
    const categories = await Category.findAll({
      attributes: ['id', 'name', 'description']
    });

    console.log(`📦 Found ${categories.length} categories\n`);

    let addedCount = 0;
    let skippedCount = 0;

    for (const category of categories) {
      const categoryName = category.name;

      // Skip if category has no name
      if (!categoryName) {
        console.log(`  ⏭️  Skipped category ID ${category.id}: No name`);
        skippedCount++;
        continue;
      }

      const translationKey = `category_name_${category.id}`;
      const descriptionKey = `category_description_${category.id}`;

      // Translate category name
      let dutchName = categoryTranslations[categoryName] || categoryName;

      // Simple translation logic for common patterns
      if (!categoryTranslations[categoryName]) {
        // Try to find partial matches
        for (const [en, nl] of Object.entries(categoryTranslations)) {
          if (categoryName && categoryName.includes(en)) {
            dutchName = categoryName.replace(en, nl);
            break;
          }
        }
      }

      try {
        // Add name translation
        const [nameTranslation, nameCreated] = await Translation.findOrCreate({
          where: {
            key: translationKey,
            language_code: 'nl'
          },
          defaults: {
            key: translationKey,
            language_code: 'nl',
            value: dutchName,
            category: 'category'
          }
        });

        if (nameCreated) {
          console.log(`  ✅ Category name: ${categoryName} → ${dutchName}`);
          addedCount++;
        } else {
          console.log(`  ⏭️  Skipped: ${categoryName} (already exists)`);
          skippedCount++;
        }

        // Add description translation if exists
        if (category.description) {
          const [descTranslation, descCreated] = await Translation.findOrCreate({
            where: {
              key: descriptionKey,
              language_code: 'nl'
            },
            defaults: {
              key: descriptionKey,
              language_code: 'nl',
              value: category.description, // Keep original for now, can be manually translated later
              category: 'category'
            }
          });

          if (descCreated) {
            addedCount++;
          }
        }
      } catch (error) {
        console.error(`  ❌ Error adding translation for ${categoryName}:`, error.message);
      }
    }

    console.log('\n📊 Category Translation Summary:');
    console.log(`  ✅ Added: ${addedCount}`);
    console.log(`  ⏭️  Skipped: ${skippedCount}`);

    return { addedCount, skippedCount };
  } catch (error) {
    console.error('❌ Error fetching categories:', error);
    throw error;
  }
}

async function addProductTranslations() {
  console.log('\n🔄 Fetching products from database...\n');

  try {
    const products = await Product.findAll({
      attributes: ['id', 'name', 'description', 'short_description']
    });

    console.log(`📦 Found ${products.length} products\n`);

    let addedCount = 0;
    let skippedCount = 0;

    for (const product of products) {
      const productName = product.name;

      // Skip if product has no name
      if (!productName) {
        console.log(`  ⏭️  Skipped product ID ${product.id}: No name`);
        skippedCount++;
        continue;
      }

      const nameKey = `product_name_${product.id}`;
      const descKey = `product_description_${product.id}`;
      const shortDescKey = `product_short_description_${product.id}`;

      // Translate product name using common terms
      let dutchName = productName;
      for (const [en, nl] of Object.entries(productTermTranslations)) {
        if (productName && productName.includes(en)) {
          dutchName = productName.replace(new RegExp(en, 'gi'), nl);
        }
      }

      try {
        // Add name translation
        const [nameTranslation, nameCreated] = await Translation.findOrCreate({
          where: {
            key: nameKey,
            language_code: 'nl'
          },
          defaults: {
            key: nameKey,
            language_code: 'nl',
            value: dutchName,
            category: 'product'
          }
        });

        if (nameCreated) {
          console.log(`  ✅ Product: ${productName} → ${dutchName}`);
          addedCount++;
        } else {
          console.log(`  ⏭️  Skipped: ${productName} (already exists)`);
          skippedCount++;
        }

        // Add description translations (keeping original for now)
        if (product.description) {
          await Translation.findOrCreate({
            where: {
              key: descKey,
              language_code: 'nl'
            },
            defaults: {
              key: descKey,
              language_code: 'nl',
              value: product.description,
              category: 'product'
            }
          });
        }

        if (product.short_description) {
          await Translation.findOrCreate({
            where: {
              key: shortDescKey,
              language_code: 'nl'
            },
            defaults: {
              key: shortDescKey,
              language_code: 'nl',
              value: product.short_description,
              category: 'product'
            }
          });
        }
      } catch (error) {
        console.error(`  ❌ Error adding translation for ${productName}:`, error.message);
      }
    }

    console.log('\n📊 Product Translation Summary:');
    console.log(`  ✅ Added: ${addedCount}`);
    console.log(`  ⏭️  Skipped: ${skippedCount}`);

    return { addedCount, skippedCount };
  } catch (error) {
    console.error('❌ Error fetching products:', error);
    throw error;
  }
}

async function main() {
  console.log('🌍 Adding Dutch translations for categories and products\n');
  console.log('=' .repeat(60) + '\n');

  try {
    const categoryResults = await addCategoryTranslations();
    const productResults = await addProductTranslations();

    console.log('\n' + '='.repeat(60));
    console.log('\n📊 Overall Summary:');
    console.log(`  Categories: ${categoryResults.addedCount} added, ${categoryResults.skippedCount} skipped`);
    console.log(`  Products: ${productResults.addedCount} added, ${productResults.skippedCount} skipped`);
    console.log(`  Total Added: ${categoryResults.addedCount + productResults.addedCount}`);
    console.log('\n✨ Done! All category and product translations have been added.');
    console.log('\nℹ️  Note: Product descriptions are kept in original language.');
    console.log('   You can manually update them in the admin panel if needed.');
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
main()
  .then(() => {
    console.log('\n✅ Script completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
