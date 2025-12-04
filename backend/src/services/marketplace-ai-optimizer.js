const Anthropic = require('@anthropic-ai/sdk');

/**
 * Marketplace AI Optimizer
 *
 * 🔥 COOL FEATURE: AI-powered product optimization for marketplaces
 * - Optimizes titles, descriptions, bullet points for SEO
 * - Suggests best categories and keywords
 * - Validates product data quality
 * - Auto-fixes common issues
 *
 * This is what makes us better than Channable!
 */
class MarketplaceAIOptimizer {
  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
  }

  /**
   * Optimize product for Amazon marketplace
   */
  async optimizeForAmazon(product, options = {}) {
    const {
      targetAudience = 'general',
      emphasizeFeatures = [],
      pricePoint = 'mid-range'
    } = options;

    const prompt = `You are an Amazon product listing expert. Optimize this product for maximum visibility and conversion on Amazon.

Product Data:
- Current Title: ${product.title || 'N/A'}
- Current Description: ${product.description || 'N/A'}
- Category: ${product.category || 'N/A'}
- Price: $${product.price || 'N/A'}
- Features: ${JSON.stringify(product.features || [])}
- Specifications: ${JSON.stringify(product.specifications || {})}

Target Audience: ${targetAudience}
Price Point: ${pricePoint}
${emphasizeFeatures.length > 0 ? `Emphasize These Features: ${emphasizeFeatures.join(', ')}` : ''}

Generate an optimized Amazon listing with:

1. **Optimized Title** (max 200 chars)
   - Include primary keywords
   - Front-load important terms
   - Follow Amazon best practices

2. **5 Bullet Points** (each max 500 chars)
   - Focus on benefits, not just features
   - Use power words
   - Address customer pain points

3. **Enhanced Description** (max 2000 chars)
   - Compelling, SEO-optimized
   - Include relevant keywords naturally
   - Structured and scannable

4. **Search Keywords** (5-10 keywords)
   - High-volume, relevant terms
   - Long-tail keywords
   - Avoid keyword stuffing

5. **Suggested Amazon Category**
   - Best fit category path
   - Reasoning for the suggestion

6. **SEO Score** (0-100)
   - Overall listing quality score
   - Specific improvement suggestions

Return as JSON with this structure:
{
  "optimizedTitle": "...",
  "bulletPoints": ["...", "...", "...", "...", "..."],
  "enhancedDescription": "...",
  "searchKeywords": ["...", "..."],
  "suggestedCategory": "...",
  "categoryReasoning": "...",
  "seoScore": 85,
  "improvements": ["...", "..."]
}`;

    try {
      const message = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-latest',
        max_tokens: 2048,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const responseText = message.content[0].text;

      // Extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse AI response');
      }

      const optimization = JSON.parse(jsonMatch[0]);

      return {
        success: true,
        ...optimization,
        original: {
          title: product.title,
          description: product.description
        }
      };

    } catch (error) {
      console.error('AI optimization failed:', error);
      return {
        success: false,
        error: error.message,
        fallback: this.generateFallbackOptimization(product)
      };
    }
  }

  /**
   * Optimize product for eBay marketplace
   */
  async optimizeForEbay(product, options = {}) {
    const {
      listingDuration = '30',
      listingFormat = 'FixedPrice',
      includeShipping = true
    } = options;

    const prompt = `You are an eBay listing expert. Optimize this product for maximum visibility and sales on eBay.

Product Data:
- Title: ${product.title || 'N/A'}
- Description: ${product.description || 'N/A'}
- Category: ${product.category || 'N/A'}
- Price: $${product.price || 'N/A'}
- Condition: ${product.condition || 'New'}
- Features: ${JSON.stringify(product.features || [])}

Listing Format: ${listingFormat}
Duration: ${listingDuration} days

Generate an optimized eBay listing with:

1. **Optimized Title** (max 80 chars - eBay limit)
   - Include brand, model, key features
   - Use eBay-specific keywords
   - Front-load searchable terms

2. **HTML Description**
   - Professional, visually appealing
   - Bullet points for features
   - Shipping and return policy
   - Call-to-action

3. **Item Specifics** (key-value pairs)
   - Brand, Model, Color, Size, etc.
   - eBay category-specific attributes

4. **Suggested eBay Category**
   - Category number if known
   - Category path

5. **Pricing Recommendation**
   - Suggested starting price
   - Buy It Now price
   - Shipping cost estimate

Return as JSON.`;

    try {
      const message = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-latest',
        max_tokens: 2048,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const responseText = message.content[0].text;
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new Error('Failed to parse AI response');
      }

      return {
        success: true,
        ...JSON.parse(jsonMatch[0]),
        original: {
          title: product.title,
          description: product.description
        }
      };

    } catch (error) {
      console.error('eBay AI optimization failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Analyze product data quality and suggest fixes
   */
  async analyzeProductQuality(product, marketplace = 'amazon') {
    const issues = [];
    const warnings = [];
    const suggestions = [];

    // Title analysis
    if (!product.title) {
      issues.push({ field: 'title', severity: 'critical', message: 'Title is missing' });
    } else {
      const titleLength = product.title.length;
      const maxLength = marketplace === 'ebay' ? 80 : 200;

      if (titleLength > maxLength) {
        issues.push({ field: 'title', severity: 'error', message: `Title too long (${titleLength}/${maxLength})` });
      }

      if (titleLength < 20) {
        warnings.push({ field: 'title', severity: 'warning', message: 'Title is very short, consider adding more keywords' });
      }

      // Check for all caps
      if (product.title === product.title.toUpperCase()) {
        issues.push({ field: 'title', severity: 'error', message: 'Title is all caps - not allowed on most marketplaces' });
      }
    }

    // Description analysis
    if (!product.description) {
      issues.push({ field: 'description', severity: 'critical', message: 'Description is missing' });
    } else if (product.description.length < 100) {
      warnings.push({ field: 'description', severity: 'warning', message: 'Description is too short for good SEO' });
    }

    // Price analysis
    if (!product.price || product.price <= 0) {
      issues.push({ field: 'price', severity: 'critical', message: 'Invalid or missing price' });
    }

    // Images analysis
    if (!product.images || product.images.length === 0) {
      issues.push({ field: 'images', severity: 'critical', message: 'No product images' });
    } else {
      if (product.images.length < 3) {
        warnings.push({ field: 'images', severity: 'warning', message: 'Add more images (recommended: 5-8)' });
      }
    }

    // Product identifiers (Amazon)
    if (marketplace === 'amazon') {
      if (!product.upc && !product.ean && !product.asin && !product.isbn) {
        issues.push({ field: 'identifiers', severity: 'critical', message: 'Missing product identifier (UPC/EAN/ASIN/ISBN)' });
      }
    }

    // SKU
    if (!product.sku) {
      issues.push({ field: 'sku', severity: 'critical', message: 'SKU is missing' });
    }

    // Inventory
    if (product.quantity === undefined || product.quantity === null) {
      warnings.push({ field: 'inventory', severity: 'warning', message: 'Inventory quantity not set' });
    } else if (product.quantity === 0) {
      warnings.push({ field: 'inventory', severity: 'warning', message: 'Product is out of stock' });
    }

    // Suggestions for improvement
    if (issues.length === 0 && warnings.length < 3) {
      suggestions.push('Consider adding bullet points to highlight key features');
      suggestions.push('Add more high-quality images from different angles');
      suggestions.push('Include product dimensions and specifications');
      suggestions.push('Add brand information if available');
    }

    // Calculate quality score
    const criticalCount = issues.filter(i => i.severity === 'critical').length;
    const errorCount = issues.filter(i => i.severity === 'error').length;
    const warningCount = warnings.length;

    let qualityScore = 100;
    qualityScore -= (criticalCount * 30);
    qualityScore -= (errorCount * 10);
    qualityScore -= (warningCount * 5);
    qualityScore = Math.max(0, qualityScore);

    return {
      qualityScore,
      readyForExport: criticalCount === 0,
      issues,
      warnings,
      suggestions,
      summary: {
        critical: criticalCount,
        errors: errorCount,
        warnings: warningCount
      }
    };
  }

  /**
   * Auto-fix common product data issues
   */
  async autoFixProduct(product, marketplace = 'amazon') {
    const fixed = { ...product };
    const fixes = [];

    // Fix title
    if (fixed.title) {
      // Remove all caps
      if (fixed.title === fixed.title.toUpperCase()) {
        fixed.title = this.toTitleCase(fixed.title);
        fixes.push('Converted all-caps title to title case');
      }

      // Truncate if too long
      const maxLength = marketplace === 'ebay' ? 80 : 200;
      if (fixed.title.length > maxLength) {
        fixed.title = fixed.title.substring(0, maxLength - 3) + '...';
        fixes.push(`Truncated title to ${maxLength} characters`);
      }

      // Remove special characters
      fixed.title = fixed.title.replace(/[^\w\s\-,.'&]/g, '');
      if (fixed.title !== product.title) {
        fixes.push('Removed invalid special characters from title');
      }
    }

    // Generate SKU if missing
    if (!fixed.sku) {
      fixed.sku = `AUTO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`.toUpperCase();
      fixes.push('Generated automatic SKU');
    }

    // Set default quantity
    if (fixed.quantity === undefined || fixed.quantity === null) {
      fixed.quantity = 0;
      fixes.push('Set default quantity to 0');
    }

    // Clean description
    if (fixed.description) {
      // Remove HTML tags if not allowed
      if (marketplace === 'amazon') {
        fixed.description = fixed.description.replace(/<[^>]*>/g, '');
        fixes.push('Removed HTML tags from description (Amazon plain text only)');
      }
    }

    return {
      fixed,
      fixes,
      fixCount: fixes.length
    };
  }

  /**
   * Generate fallback optimization (rule-based)
   */
  generateFallbackOptimization(product) {
    return {
      optimizedTitle: this.optimizeTitleFallback(product.title),
      bulletPoints: this.generateBulletPointsFallback(product),
      enhancedDescription: product.description || 'High-quality product. Contact for details.',
      searchKeywords: this.extractKeywordsFallback(product),
      seoScore: 60,
      improvements: ['AI optimization unavailable, using rule-based fallback']
    };
  }

  optimizeTitleFallback(title) {
    if (!title) return 'Product Listing';
    return this.toTitleCase(title.substring(0, 200));
  }

  generateBulletPointsFallback(product) {
    const bullets = [];
    if (product.brand) bullets.push(`Brand: ${product.brand}`);
    if (product.color) bullets.push(`Color: ${product.color}`);
    if (product.size) bullets.push(`Size: ${product.size}`);
    bullets.push('High quality construction');
    bullets.push('Fast shipping available');
    return bullets;
  }

  extractKeywordsFallback(product) {
    const keywords = new Set();
    const text = `${product.title} ${product.description} ${product.category}`.toLowerCase();

    // Simple keyword extraction
    const words = text.split(/\s+/).filter(w => w.length > 3);
    words.slice(0, 10).forEach(w => keywords.add(w));

    return Array.from(keywords);
  }

  toTitleCase(str) {
    return str.toLowerCase().split(' ').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }
}

module.exports = MarketplaceAIOptimizer;
