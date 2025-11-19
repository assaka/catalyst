import { Product } from './backend/src/models/Product.js';

async function testProductImages() {
  try {
    // Find a product with images
    const product = await Product.findOne({
      where: {
        images: {
          $ne: null
        }
      },
      limit: 1
    });

    if (!product) {
      console.log('No products with images found');
      return;
    }

    console.log('Product ID:', product.id);
    console.log('Product slug:', product.slug);
    console.log('Product images:', JSON.stringify(product.images, null, 2));
    console.log('Images type:', typeof product.images);
    console.log('Images is array?:', Array.isArray(product.images));

    if (Array.isArray(product.images) && product.images.length > 0) {
      console.log('First image structure:', JSON.stringify(product.images[0], null, 2));
      console.log('First image has url?:', product.images[0].hasOwnProperty('url'));
      console.log('First image has src?:', product.images[0].hasOwnProperty('src'));
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testProductImages();
