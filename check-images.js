const { Product } = require('./backend/src/models');
const { Op } = require('sequelize');

async function checkImages() {
  try {
    const product = await Product.findOne({
      where: {
        images: {
          [Op.ne]: null
        }
      }
    });

    if (!product) {
      console.log('No products with images found');
      process.exit(0);
    }

    console.log('Product ID:', product.id);
    console.log('Product slug:', product.slug);
    console.log('\nImages field:');
    console.log('Type:', typeof product.images);
    console.log('Is Array:', Array.isArray(product.images));
    console.log('\nFull images data:');
    console.log(JSON.stringify(product.images, null, 2));

    if (Array.isArray(product.images) && product.images.length > 0) {
      console.log('\nFirst image:');
      console.log(JSON.stringify(product.images[0], null, 2));
      console.log('\nFirst image has "url" property:', product.images[0].hasOwnProperty('url'));
      console.log('First image has "src" property:', product.images[0].hasOwnProperty('src'));
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkImages();
