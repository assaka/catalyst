const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const authMiddleware = require('../middleware/auth');
const { checkStoreOwnership } = require('../middleware/storeAuth');
const StoreTemplate = require('../models/StoreTemplate');

// All routes require authentication and store ownership
router.use(authMiddleware);
router.use(checkStoreOwnership);

/**
 * GET /api/stores/:store_id/templates
 * Get all templates for a store
 */
router.get('/', async (req, res) => {
  try {
    const storeId = req.params.store_id;
    
    const templates = await StoreTemplate.findAll({
      where: { store_id: storeId },
      order: [['updated_at', 'DESC']]
    });

    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/stores/:store_id/templates/:type
 * Get a specific template by type
 */
router.get('/:type', async (req, res) => {
  try {
    const storeId = req.params.store_id;
    const { type } = req.params;
    
    const template = await StoreTemplate.findOne({
      where: { 
        store_id: storeId,
        type: type
      }
    });

    if (!template) {
      // Return default template
      return res.json({
        success: true,
        data: getDefaultTemplate(type)
      });
    }

    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('Get template error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/stores/:store_id/templates/save
 * Save or update a template
 */
router.post('/save', async (req, res) => {
  try {
    const storeId = req.params.store_id;
    const { type, name, elements, styles, settings } = req.body;

    if (!type || !name) {
      return res.status(400).json({
        success: false,
        error: 'Template type and name are required'
      });
    }

    // Check if template exists
    let template = await StoreTemplate.findOne({
      where: {
        store_id: storeId,
        type: type
      }
    });

    const templateData = {
      name,
      elements: elements || [],
      styles: styles || {},
      settings: settings || {},
      updated_at: new Date()
    };

    if (template) {
      // Update existing template
      await template.update(templateData);
    } else {
      // Create new template
      template = await StoreTemplate.create({
        id: uuidv4(),
        store_id: storeId,
        type,
        ...templateData,
        created_at: new Date()
      });
    }

    res.json({
      success: true,
      message: 'Template saved successfully',
      data: template
    });
  } catch (error) {
    console.error('Save template error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/stores/:store_id/templates/generate-ai
 * Generate template with AI
 */
router.post('/generate-ai', async (req, res) => {
  try {
    const storeId = req.params.store_id;
    const { prompt, templateType, context } = req.body;

    if (!prompt || !templateType) {
      return res.status(400).json({
        success: false,
        error: 'Prompt and template type are required'
      });
    }

    console.log(`🤖 Generating ${templateType} template with AI:`, prompt);

    // Generate template based on type and prompt
    const template = await generateTemplateWithAI(prompt, templateType, context);

    res.json({
      success: true,
      message: 'Template generated successfully',
      template
    });
  } catch (error) {
    console.error('AI template generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/stores/:store_id/templates/:type
 * Delete a template (reset to default)
 */
router.delete('/:type', async (req, res) => {
  try {
    const storeId = req.params.store_id;
    const { type } = req.params;

    await StoreTemplate.destroy({
      where: {
        store_id: storeId,
        type: type
      }
    });

    res.json({
      success: true,
      message: 'Template reset to default'
    });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Generate template with AI
 */
async function generateTemplateWithAI(prompt, templateType, context) {
  try {
    // Try to use OpenAI if available
    if (process.env.OPENAI_API_KEY) {
      const OpenAI = require('openai');
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
      
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: `You are a template designer for an e-commerce platform. Generate a complete page template based on the user's request.
              
              Return a JSON object with:
              - name: string (template name)
              - type: string (category, product, checkout, or homepage)
              - elements: array of page elements with id, type, name, content, position, size, and styles
              - styles: object with CSS styles for the template
              - settings: object with template-specific settings
              
              Elements should include HTML content and positioning information.
              Focus on creating a modern, responsive, and user-friendly design.`
            },
            {
              role: "user",
              content: `Create a ${templateType} template: ${prompt}`
            }
          ],
          temperature: 0.7,
          max_tokens: 2000
        });
        
        const response = JSON.parse(completion.choices[0].message.content);
        return response;
      } catch (aiError) {
        console.error('OpenAI API error:', aiError);
        // Fall back to intelligent template generation
      }
    }
    
    // Intelligent fallback generation based on template type and prompt
    const promptLower = prompt.toLowerCase();
    
    if (templateType === 'category') {
      return generateCategoryTemplate(prompt);
    } else if (templateType === 'product') {
      return generateProductTemplate(prompt);
    } else if (templateType === 'checkout') {
      return generateCheckoutTemplate(prompt);
    } else if (templateType === 'homepage') {
      return generateHomepageTemplate(prompt);
    }
    
    // Default template
    return getDefaultTemplate(templateType);
    
  } catch (error) {
    console.error('Template generation error:', error);
    throw error;
  }
}

/**
 * Generate category page template
 */
function generateCategoryTemplate(prompt) {
  const promptLower = prompt.toLowerCase();
  const isMinimal = promptLower.includes('minimal') || promptLower.includes('simple');
  const isSidebar = promptLower.includes('sidebar') || promptLower.includes('filter');
  const isGrid = !promptLower.includes('list');
  
  return {
    name: 'Category Page',
    type: 'category',
    elements: [
      {
        id: 'breadcrumb-1',
        type: 'element',
        name: 'Breadcrumb',
        content: '<nav class="breadcrumb"><a href="/">Home</a> / <span>Category</span></nav>',
        position: { x: 0, y: 0 },
        size: { width: '100%', height: 40 }
      },
      {
        id: 'header-1',
        type: 'section',
        name: 'Category Header',
        content: '<div class="category-header"><h1>{category.name}</h1><p>{category.description}</p></div>',
        position: { x: 0, y: 50 },
        size: { width: '100%', height: 120 }
      },
      ...(isSidebar ? [{
        id: 'sidebar-1',
        type: 'widget',
        name: 'Filter Sidebar',
        content: `<aside class="filters">
          <h3>Filters</h3>
          <div class="filter-group">
            <h4>Price</h4>
            <input type="range" min="0" max="1000" />
          </div>
          <div class="filter-group">
            <h4>Brand</h4>
            <label><input type="checkbox" /> Brand A</label>
            <label><input type="checkbox" /> Brand B</label>
          </div>
          <div class="filter-group">
            <h4>Size</h4>
            <label><input type="checkbox" /> Small</label>
            <label><input type="checkbox" /> Medium</label>
            <label><input type="checkbox" /> Large</label>
          </div>
        </aside>`,
        position: { x: 0, y: 180 },
        size: { width: 250, height: 400 }
      }] : []),
      {
        id: 'sort-1',
        type: 'element',
        name: 'Sort Dropdown',
        content: `<div class="sort-container">
          <label>Sort by:</label>
          <select class="sort-select">
            <option>Featured</option>
            <option>Price: Low to High</option>
            <option>Price: High to Low</option>
            <option>Newest</option>
            <option>Best Selling</option>
          </select>
        </div>`,
        position: { x: isSidebar ? 270 : 0, y: 180 },
        size: { width: 200, height: 40 }
      },
      {
        id: 'products-1',
        type: 'widget',
        name: 'Product Grid',
        content: `<div class="product-${isGrid ? 'grid' : 'list'}">
          {products.map(product => 
            <div class="product-card">
              <img src="{product.image}" alt="{product.name}" />
              <h3>{product.name}</h3>
              <p class="price">{product.price}</p>
              <button class="add-to-cart">Add to Cart</button>
            </div>
          )}
        </div>`,
        position: { x: isSidebar ? 270 : 0, y: 230 },
        size: { width: isSidebar ? 'calc(100% - 270px)' : '100%', height: 'auto' }
      },
      {
        id: 'pagination-1',
        type: 'element',
        name: 'Pagination',
        content: '<div class="pagination"><button>Previous</button><span>1 2 3 ... 10</span><button>Next</button></div>',
        position: { x: 0, y: 'auto' },
        size: { width: '100%', height: 60 }
      }
    ],
    styles: {
      '.category-header': {
        'text-align': 'center',
        'padding': '20px',
        'background': isMinimal ? 'white' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'color': isMinimal ? '#333' : 'white'
      },
      '.product-grid': {
        'display': 'grid',
        'grid-template-columns': `repeat(${isSidebar ? 3 : 4}, 1fr)`,
        'gap': '20px',
        'padding': '20px'
      },
      '.product-list': {
        'display': 'flex',
        'flex-direction': 'column',
        'gap': '15px',
        'padding': '20px'
      },
      '.product-card': {
        'border': '1px solid #e5e5e5',
        'border-radius': '8px',
        'padding': '15px',
        'transition': 'all 0.3s',
        'background': 'white'
      },
      '.filters': {
        'background': '#f8f9fa',
        'padding': '20px',
        'border-radius': '8px',
        'position': 'sticky',
        'top': '20px'
      }
    },
    settings: {
      layout: isGrid ? 'grid' : 'list',
      columns: isSidebar ? 3 : 4,
      showFilters: isSidebar,
      showSort: true,
      productsPerPage: 12
    }
  };
}

/**
 * Generate product detail template
 */
function generateProductTemplate(prompt) {
  const promptLower = prompt.toLowerCase();
  const hasTabs = promptLower.includes('tab');
  const hasReviews = promptLower.includes('review') || promptLower.includes('rating');
  const hasRelated = promptLower.includes('related') || promptLower.includes('similar');
  
  return {
    name: 'Product Detail Page',
    type: 'product',
    elements: [
      {
        id: 'breadcrumb-1',
        type: 'element',
        name: 'Breadcrumb',
        content: '<nav class="breadcrumb"><a href="/">Home</a> / <a href="/category">Category</a> / <span>{product.name}</span></nav>',
        position: { x: 0, y: 0 },
        size: { width: '100%', height: 40 }
      },
      {
        id: 'gallery-1',
        type: 'widget',
        name: 'Product Gallery',
        content: `<div class="product-gallery">
          <div class="main-image">
            <img src="{product.mainImage}" alt="{product.name}" />
          </div>
          <div class="thumbnails">
            {product.images.map(img => <img src="{img}" alt="" />)}
          </div>
        </div>`,
        position: { x: 0, y: 50 },
        size: { width: '50%', height: 500 }
      },
      {
        id: 'details-1',
        type: 'section',
        name: 'Product Details',
        content: `<div class="product-details">
          <h1>{product.name}</h1>
          <div class="price-section">
            <span class="price">{product.price}</span>
            {product.comparePrice && <span class="compare-price">{product.comparePrice}</span>}
          </div>
          <div class="rating">
            ⭐⭐⭐⭐⭐ <span>(4.5 stars, 120 reviews)</span>
          </div>
          <p class="description">{product.shortDescription}</p>
          <div class="options">
            <label>Size:</label>
            <select><option>Small</option><option>Medium</option><option>Large</option></select>
          </div>
          <div class="quantity">
            <label>Quantity:</label>
            <input type="number" value="1" min="1" />
          </div>
          <button class="add-to-cart-btn">Add to Cart</button>
          <button class="buy-now-btn">Buy Now</button>
        </div>`,
        position: { x: '50%', y: 50 },
        size: { width: '50%', height: 500 }
      },
      ...(hasTabs ? [{
        id: 'tabs-1',
        type: 'widget',
        name: 'Product Tabs',
        content: `<div class="product-tabs">
          <div class="tab-headers">
            <button class="tab-header active">Description</button>
            <button class="tab-header">Specifications</button>
            <button class="tab-header">Reviews</button>
            <button class="tab-header">Shipping</button>
          </div>
          <div class="tab-content">
            <div class="tab-pane active">{product.fullDescription}</div>
            <div class="tab-pane">{product.specifications}</div>
            <div class="tab-pane">{reviews}</div>
            <div class="tab-pane">{shippingInfo}</div>
          </div>
        </div>`,
        position: { x: 0, y: 570 },
        size: { width: '100%', height: 300 }
      }] : []),
      ...(hasReviews ? [{
        id: 'reviews-1',
        type: 'section',
        name: 'Customer Reviews',
        content: `<div class="reviews-section">
          <h2>Customer Reviews</h2>
          <div class="review-summary">
            <div class="average-rating">4.5 ⭐</div>
            <div class="rating-breakdown">
              <div>5 stars: 70%</div>
              <div>4 stars: 20%</div>
              <div>3 stars: 5%</div>
              <div>2 stars: 3%</div>
              <div>1 star: 2%</div>
            </div>
          </div>
          <div class="review-list">
            {reviews.map(review => 
              <div class="review">
                <div class="review-header">
                  <strong>{review.author}</strong>
                  <span>{review.rating} ⭐</span>
                </div>
                <p>{review.comment}</p>
              </div>
            )}
          </div>
        </div>`,
        position: { x: 0, y: hasTabs ? 890 : 570 },
        size: { width: '100%', height: 400 }
      }] : []),
      ...(hasRelated ? [{
        id: 'related-1',
        type: 'widget',
        name: 'Related Products',
        content: `<div class="related-products">
          <h2>You May Also Like</h2>
          <div class="product-carousel">
            {relatedProducts.map(product => 
              <div class="product-card">
                <img src="{product.image}" alt="{product.name}" />
                <h4>{product.name}</h4>
                <p class="price">{product.price}</p>
              </div>
            )}
          </div>
        </div>`,
        position: { x: 0, y: 'auto' },
        size: { width: '100%', height: 350 }
      }] : [])
    ],
    styles: {
      '.product-gallery': {
        'padding': '20px'
      },
      '.main-image img': {
        'width': '100%',
        'border-radius': '8px'
      },
      '.thumbnails': {
        'display': 'flex',
        'gap': '10px',
        'margin-top': '15px'
      },
      '.product-details': {
        'padding': '20px'
      },
      '.price': {
        'font-size': '28px',
        'font-weight': 'bold',
        'color': '#10b981'
      },
      '.add-to-cart-btn': {
        'background': '#3b82f6',
        'color': 'white',
        'padding': '12px 30px',
        'border': 'none',
        'border-radius': '6px',
        'font-size': '16px',
        'cursor': 'pointer',
        'margin-right': '10px'
      },
      '.buy-now-btn': {
        'background': '#10b981',
        'color': 'white',
        'padding': '12px 30px',
        'border': 'none',
        'border-radius': '6px',
        'font-size': '16px',
        'cursor': 'pointer'
      }
    },
    settings: {
      layout: 'two-column',
      imagePosition: 'left',
      showReviews: hasReviews,
      showRelated: hasRelated,
      showTabs: hasTabs
    }
  };
}

/**
 * Generate checkout template
 */
function generateCheckoutTemplate(prompt) {
  const promptLower = prompt.toLowerCase();
  const isOnePage = promptLower.includes('one') || promptLower.includes('single');
  const hasGuest = promptLower.includes('guest');
  
  return {
    name: 'Checkout Page',
    type: 'checkout',
    elements: [
      {
        id: 'header-1',
        type: 'section',
        name: 'Checkout Header',
        content: '<div class="checkout-header"><h1>Checkout</h1><div class="steps">1. Shipping → 2. Payment → 3. Review</div></div>',
        position: { x: 0, y: 0 },
        size: { width: '100%', height: 100 }
      },
      {
        id: 'form-1',
        type: 'widget',
        name: 'Checkout Form',
        content: `<form class="checkout-form">
          <div class="form-section">
            <h2>Shipping Information</h2>
            <input type="email" placeholder="Email" required />
            <div class="form-row">
              <input type="text" placeholder="First Name" required />
              <input type="text" placeholder="Last Name" required />
            </div>
            <input type="text" placeholder="Address" required />
            <div class="form-row">
              <input type="text" placeholder="City" required />
              <select><option>State</option></select>
              <input type="text" placeholder="ZIP" required />
            </div>
          </div>
          
          <div class="form-section">
            <h2>Payment Method</h2>
            <div class="payment-options">
              <label><input type="radio" name="payment" /> Credit Card</label>
              <label><input type="radio" name="payment" /> PayPal</label>
              <label><input type="radio" name="payment" /> Apple Pay</label>
            </div>
            <input type="text" placeholder="Card Number" />
            <div class="form-row">
              <input type="text" placeholder="MM/YY" />
              <input type="text" placeholder="CVV" />
            </div>
          </div>
        </form>`,
        position: { x: 0, y: 110 },
        size: { width: '60%', height: 'auto' }
      },
      {
        id: 'summary-1',
        type: 'widget',
        name: 'Order Summary',
        content: `<div class="order-summary">
          <h2>Order Summary</h2>
          <div class="order-items">
            {cart.items.map(item => 
              <div class="order-item">
                <img src="{item.image}" alt="{item.name}" />
                <div class="item-details">
                  <p>{item.name}</p>
                  <p>Qty: {item.quantity}</p>
                </div>
                <p class="item-price">{item.price}</p>
              </div>
            )}
          </div>
          <div class="summary-totals">
            <div class="summary-row">
              <span>Subtotal:</span>
              <span>{cart.subtotal}</span>
            </div>
            <div class="summary-row">
              <span>Shipping:</span>
              <span>{cart.shipping}</span>
            </div>
            <div class="summary-row">
              <span>Tax:</span>
              <span>{cart.tax}</span>
            </div>
            <div class="summary-row total">
              <span>Total:</span>
              <span>{cart.total}</span>
            </div>
          </div>
          <button class="place-order-btn">Place Order</button>
        </div>`,
        position: { x: '60%', y: 110 },
        size: { width: '40%', height: 'auto' }
      }
    ],
    styles: {
      '.checkout-header': {
        'text-align': 'center',
        'padding': '20px',
        'background': '#f8f9fa'
      },
      '.checkout-form': {
        'padding': '30px',
        'background': 'white',
        'border-radius': '8px',
        'box-shadow': '0 2px 10px rgba(0,0,0,0.1)'
      },
      '.form-section': {
        'margin-bottom': '30px'
      },
      '.form-row': {
        'display': 'grid',
        'grid-template-columns': '1fr 1fr',
        'gap': '15px'
      },
      'input, select': {
        'width': '100%',
        'padding': '10px',
        'border': '1px solid #e5e5e5',
        'border-radius': '4px',
        'margin-bottom': '15px'
      },
      '.order-summary': {
        'padding': '30px',
        'background': '#f8f9fa',
        'border-radius': '8px',
        'position': 'sticky',
        'top': '20px'
      },
      '.place-order-btn': {
        'width': '100%',
        'padding': '15px',
        'background': '#10b981',
        'color': 'white',
        'border': 'none',
        'border-radius': '6px',
        'font-size': '18px',
        'font-weight': 'bold',
        'cursor': 'pointer'
      }
    },
    settings: {
      layout: isOnePage ? 'single-page' : 'multi-step',
      showOrderSummary: true,
      guestCheckout: hasGuest,
      expressCheckout: true
    }
  };
}

/**
 * Generate homepage template
 */
function generateHomepageTemplate(prompt) {
  const promptLower = prompt.toLowerCase();
  const hasHero = !promptLower.includes('no hero');
  const hasCategories = promptLower.includes('categor');
  const hasTestimonials = promptLower.includes('testimonial') || promptLower.includes('review');
  
  return {
    name: 'Homepage',
    type: 'homepage',
    elements: [
      ...(hasHero ? [{
        id: 'hero-1',
        type: 'section',
        name: 'Hero Section',
        content: `<section class="hero">
          <div class="hero-content">
            <h1>Welcome to {store.name}</h1>
            <p>Discover amazing products at unbeatable prices</p>
            <button class="cta-button">Shop Now</button>
          </div>
          <div class="hero-image">
            <img src="/hero-image.jpg" alt="Hero" />
          </div>
        </section>`,
        position: { x: 0, y: 0 },
        size: { width: '100%', height: 500 }
      }] : []),
      ...(hasCategories ? [{
        id: 'categories-1',
        type: 'widget',
        name: 'Category Grid',
        content: `<section class="categories">
          <h2>Shop by Category</h2>
          <div class="category-grid">
            {categories.map(cat => 
              <div class="category-card">
                <img src="{cat.image}" alt="{cat.name}" />
                <h3>{cat.name}</h3>
                <p>{cat.productCount} products</p>
              </div>
            )}
          </div>
        </section>`,
        position: { x: 0, y: hasHero ? 520 : 0 },
        size: { width: '100%', height: 400 }
      }] : []),
      {
        id: 'featured-1',
        type: 'widget',
        name: 'Featured Products',
        content: `<section class="featured-products">
          <h2>Featured Products</h2>
          <div class="product-slider">
            {featuredProducts.map(product => 
              <div class="product-card">
                <img src="{product.image}" alt="{product.name}" />
                <h4>{product.name}</h4>
                <p class="price">{product.price}</p>
                <button class="add-to-cart">Add to Cart</button>
              </div>
            )}
          </div>
        </section>`,
        position: { x: 0, y: 'auto' },
        size: { width: '100%', height: 450 }
      },
      ...(hasTestimonials ? [{
        id: 'testimonials-1',
        type: 'section',
        name: 'Testimonials',
        content: `<section class="testimonials">
          <h2>What Our Customers Say</h2>
          <div class="testimonial-grid">
            <div class="testimonial">
              <p>"Amazing products and fast shipping!"</p>
              <div class="author">- Sarah J.</div>
              <div class="rating">⭐⭐⭐⭐⭐</div>
            </div>
            <div class="testimonial">
              <p>"Best online shopping experience ever!"</p>
              <div class="author">- Mike D.</div>
              <div class="rating">⭐⭐⭐⭐⭐</div>
            </div>
            <div class="testimonial">
              <p>"Great quality and excellent customer service."</p>
              <div class="author">- Lisa K.</div>
              <div class="rating">⭐⭐⭐⭐⭐</div>
            </div>
          </div>
        </section>`,
        position: { x: 0, y: 'auto' },
        size: { width: '100%', height: 300 }
      }] : [])
    ],
    styles: {
      '.hero': {
        'display': 'flex',
        'align-items': 'center',
        'padding': '60px',
        'background': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'color': 'white'
      },
      '.hero-content h1': {
        'font-size': '48px',
        'margin-bottom': '20px'
      },
      '.cta-button': {
        'background': 'white',
        'color': '#667eea',
        'padding': '15px 40px',
        'border': 'none',
        'border-radius': '50px',
        'font-size': '18px',
        'font-weight': 'bold',
        'cursor': 'pointer'
      },
      '.category-grid': {
        'display': 'grid',
        'grid-template-columns': 'repeat(4, 1fr)',
        'gap': '30px',
        'padding': '40px'
      },
      '.product-slider': {
        'display': 'flex',
        'gap': '20px',
        'overflow-x': 'auto',
        'padding': '20px'
      },
      '.testimonial-grid': {
        'display': 'grid',
        'grid-template-columns': 'repeat(3, 1fr)',
        'gap': '30px',
        'padding': '40px'
      },
      '.testimonial': {
        'background': 'white',
        'padding': '30px',
        'border-radius': '8px',
        'box-shadow': '0 2px 10px rgba(0,0,0,0.1)',
        'text-align': 'center'
      }
    },
    settings: {
      heroSection: hasHero,
      featuredProducts: true,
      categories: hasCategories,
      testimonials: hasTestimonials,
      newsletter: true
    }
  };
}

/**
 * Get default template
 */
function getDefaultTemplate(type) {
  const defaults = {
    category: generateCategoryTemplate('default category page with sidebar and grid layout'),
    product: generateProductTemplate('default product page with gallery, details, and reviews'),
    checkout: generateCheckoutTemplate('default checkout page with order summary'),
    homepage: generateHomepageTemplate('default homepage with hero, categories, and featured products')
  };
  
  return defaults[type] || defaults.homepage;
}

module.exports = router;