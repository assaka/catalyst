/**
 * Seed 3 Example Plugins for hamid2 store
 * - No-Code AI Mode: Product Reviews
 * - Guided Builder Mode: Loyalty Points
 * - Developer Mode: Advanced Email Campaigns
 */

const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' ? {
      require: true,
      rejectUnauthorized: false
    } : false
  }
});

const examplePlugins = [
  {
    // No-Code AI Mode Example
    name: 'Product Reviews',
    slug: 'product-reviews',
    description: '5-star rating system with customer reviews and photo uploads',
    version: '1.0.0',
    author: 'AI Generator',
    category: 'commerce',
    status: 'active',
    store_id: 'hamid2',
    generated_by_ai: true,
    plugin_structure: {
      mode: 'nocode-ai',
      template: 'reviews',
      features: [
        { type: 'api_endpoint', config: { path: '/api/reviews', methods: ['GET', 'POST'] } },
        { type: 'webhook', config: { hook: 'product.render', priority: 10 } }
      ],
      database: {
        tables: [
          {
            name: 'product_reviews',
            fields: [
              { name: 'id', type: 'uuid', primary: true },
              { name: 'product_id', type: 'uuid', required: true },
              { name: 'customer_id', type: 'uuid', required: true },
              { name: 'rating', type: 'integer', required: true, min: 1, max: 5 },
              { name: 'review_text', type: 'text', required: false },
              { name: 'photos', type: 'jsonb', required: false },
              { name: 'created_at', type: 'timestamp', default: 'now()' }
            ]
          }
        ]
      },
      ui: {
        widgets: [
          { name: 'ReviewWidget', type: 'product_page', position: 'below_description' }
        ],
        pages: [
          { name: 'Review Moderation', path: '/admin/reviews', icon: 'Star' }
        ]
      },
      adminNavigation: {
        enabled: true,
        label: 'Product Reviews',
        icon: 'Star',
        route: '/admin/reviews',
        order: 70,
        parentKey: 'products',
        description: 'Manage customer product reviews and ratings'
      },
      generatedFiles: [
        {
          name: 'models/ProductReview.js',
          code: `class ProductReview {
  constructor(db) {
    this.db = db;
  }

  async create(data) {
    const { product_id, customer_id, rating, review_text, photos } = data;
    return await this.db.query(
      'INSERT INTO product_reviews (id, product_id, customer_id, rating, review_text, photos) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5) RETURNING *',
      [product_id, customer_id, rating, review_text, photos]
    );
  }

  async getByProduct(product_id) {
    return await this.db.query(
      'SELECT * FROM product_reviews WHERE product_id = $1 ORDER BY created_at DESC',
      [product_id]
    );
  }

  async getAverageRating(product_id) {
    const result = await this.db.query(
      'SELECT AVG(rating)::numeric(10,2) as average FROM product_reviews WHERE product_id = $1',
      [product_id]
    );
    return result.rows[0]?.average || 0;
  }
}`
        },
        {
          name: 'components/ReviewWidget.jsx',
          code: `import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';

const ReviewWidget = ({ productId }) => {
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');

  useEffect(() => {
    fetch(\`/api/reviews?product_id=\${productId}\`)
      .then(res => res.json())
      .then(data => setReviews(data));
  }, [productId]);

  const submitReview = async () => {
    await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: productId, rating, review_text: reviewText })
    });
    setReviewText('');
    // Reload reviews
  };

  return (
    <div className="review-widget">
      <h3>Customer Reviews</h3>
      <div className="reviews-list">
        {reviews.map(review => (
          <div key={review.id} className="review-item">
            <div className="rating">
              {[...Array(review.rating)].map((_, i) => (
                <Star key={i} className="star-filled" />
              ))}
            </div>
            <p>{review.review_text}</p>
          </div>
        ))}
      </div>
      <div className="submit-review">
        <h4>Write a Review</h4>
        <textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)} />
        <button onClick={submitReview}>Submit</button>
      </div>
    </div>
  );
};`
        }
      ]
    },
    hooks: [
      {
        hook_name: 'product.render',
        priority: 10,
        handler_code: `async function productRenderHook(product) {
  const reviews = await this.models.ProductReview.getByProduct(product.id);
  const averageRating = await this.models.ProductReview.getAverageRating(product.id);

  product.reviews = reviews;
  product.average_rating = averageRating;
  product.review_count = reviews.length;

  return product;
}`
      }
    ],
    events: [
      {
        event_name: 'review.created',
        listener_code: `async function onReviewCreated(review) {
  // Send notification to product owner
  await this.notifications.send({
    to: review.product.owner_email,
    subject: 'New Review on Your Product',
    body: \`Someone left a \${review.rating}-star review on \${review.product.name}\`
  });
}`
      }
    ]
  },

  {
    // Guided Builder Mode Example
    name: 'Loyalty Points System',
    slug: 'loyalty-points',
    description: 'Reward customers with points for purchases, reviews, and referrals',
    version: '1.0.0',
    author: 'hamid',
    category: 'marketing',
    status: 'active',
    store_id: 'hamid2',
    generated_by_ai: true,
    plugin_structure: {
      mode: 'guided',
      features: [
        { type: 'api_endpoint', config: { path: '/api/loyalty/points', methods: ['GET', 'POST'] } },
        { type: 'api_endpoint', config: { path: '/api/loyalty/redeem', methods: ['POST'] } },
        { type: 'webhook', config: { hook: 'order.completed', priority: 5 } },
        { type: 'cron_job', config: { schedule: '0 0 * * *', task: 'expire_points' } }
      ],
      database: {
        tables: [
          {
            name: 'loyalty_points',
            fields: [
              { name: 'id', type: 'uuid', primary: true },
              { name: 'customer_id', type: 'uuid', required: true },
              { name: 'points', type: 'integer', required: true, default: 0 },
              { name: 'lifetime_points', type: 'integer', required: true, default: 0 },
              { name: 'tier', type: 'string', required: false },
              { name: 'updated_at', type: 'timestamp', default: 'now()' }
            ]
          },
          {
            name: 'points_transactions',
            fields: [
              { name: 'id', type: 'uuid', primary: true },
              { name: 'customer_id', type: 'uuid', required: true },
              { name: 'amount', type: 'integer', required: true },
              { name: 'type', type: 'string', required: true },
              { name: 'description', type: 'text', required: false },
              { name: 'created_at', type: 'timestamp', default: 'now()' }
            ]
          }
        ]
      },
      ui: {
        widgets: [
          { name: 'PointsBalance', type: 'customer_dashboard', position: 'top' },
          { name: 'RedeemPoints', type: 'checkout', position: 'payment_section' }
        ],
        pages: [
          { name: 'Loyalty Dashboard', path: '/admin/loyalty', icon: 'Award' },
          { name: 'Points History', path: '/admin/loyalty/history', icon: 'History' }
        ]
      },
      adminNavigation: {
        enabled: true,
        label: 'Loyalty Points',
        icon: 'Award',
        route: '/admin/loyalty',
        order: 60,
        parentKey: null,
        description: 'Manage customer loyalty points and rewards'
      },
      generatedFiles: [
        {
          name: 'controllers/LoyaltyController.js',
          code: `class LoyaltyController {
  async getPoints(req, res) {
    const { customer_id } = req.params;
    const points = await this.db.query(
      'SELECT * FROM loyalty_points WHERE customer_id = $1',
      [customer_id]
    );
    res.json(points.rows[0]);
  }

  async addPoints(customer_id, amount, type, description) {
    // Add to balance
    await this.db.query(
      'UPDATE loyalty_points SET points = points + $1, lifetime_points = lifetime_points + $1 WHERE customer_id = $2',
      [amount, customer_id]
    );

    // Record transaction
    await this.db.query(
      'INSERT INTO points_transactions (id, customer_id, amount, type, description) VALUES (gen_random_uuid(), $1, $2, $3, $4)',
      [customer_id, amount, type, description]
    );

    // Check tier upgrade
    await this.checkTierUpgrade(customer_id);
  }

  async redeemPoints(customer_id, amount) {
    const balance = await this.getPoints({ params: { customer_id } });
    if (balance.points < amount) {
      throw new Error('Insufficient points');
    }

    await this.db.query(
      'UPDATE loyalty_points SET points = points - $1 WHERE customer_id = $2',
      [amount, customer_id]
    );

    return { success: true, discount: amount * 0.01 }; // 100 points = $1
  }
}`
        }
      ]
    },
    hooks: [
      {
        hook_name: 'order.completed',
        priority: 5,
        handler_code: `async function orderCompletedHook(order) {
  const pointsEarned = Math.floor(order.total * 10); // 10 points per dollar
  await this.loyalty.addPoints(
    order.customer_id,
    pointsEarned,
    'purchase',
    \`Order #\${order.id}\`
  );
  return order;
}`
      }
    ],
    events: [
      {
        event_name: 'tier.upgraded',
        listener_code: `async function onTierUpgrade(customer, newTier) {
  await this.email.send({
    to: customer.email,
    subject: 'Congratulations! You've been upgraded!',
    body: \`You've reached \${newTier} tier! Enjoy exclusive benefits.\`
  });
}`
      }
    ]
  },

  {
    // Developer Mode Example
    name: 'Advanced Email Campaign Manager',
    slug: 'email-campaigns-pro',
    description: 'AI-powered email campaigns with segmentation, A/B testing, and analytics',
    version: '1.2.0',
    author: 'hamid',
    category: 'marketing',
    status: 'active',
    store_id: 'hamid2',
    generated_by_ai: false,
    plugin_structure: {
      mode: 'developer',
      controllers: [
        {
          name: 'CampaignController',
          code: `const { Op } = require('sequelize');
const Anthropic = require('@anthropic-ai/sdk');

class CampaignController {
  constructor(db, redis, anthropic) {
    this.db = db;
    this.redis = redis;
    this.anthropic = anthropic;
  }

  async createCampaign(req, res) {
    const { name, subject, segment, template_id, ab_test_enabled } = req.body;

    const campaign = await this.db.Campaign.create({
      name,
      subject,
      segment: JSON.stringify(segment),
      template_id,
      ab_test_enabled,
      status: 'draft',
      created_by: req.user.id
    });

    res.json(campaign);
  }

  async generateEmailContent(req, res) {
    const { campaign_id, prompt } = req.body;

    // Use Claude API to generate email content
    const message = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: \`Generate a professional email campaign for an e-commerce store.

Prompt: \${prompt}

Return HTML email content with subject line.\`
      }]
    });

    const content = message.content[0].text;

    await this.db.Campaign.update(
      { ai_generated_content: content },
      { where: { id: campaign_id } }
    );

    res.json({ content });
  }

  async segmentAudience(req, res) {
    const { criteria } = req.body;

    // Advanced segmentation logic
    let whereClause = {};

    if (criteria.purchase_history) {
      whereClause.total_purchases = {
        [Op.gte]: criteria.purchase_history.min_purchases
      };
    }

    if (criteria.location) {
      whereClause.country = criteria.location.countries;
    }

    if (criteria.last_active) {
      whereClause.last_active_at = {
        [Op.gte]: new Date(Date.now() - criteria.last_active.days * 24 * 60 * 60 * 1000)
      };
    }

    const customers = await this.db.Customer.findAll({ where: whereClause });

    res.json({
      segment_size: customers.length,
      estimated_reach: customers.length,
      customers
    });
  }

  async sendCampaign(req, res) {
    const { campaign_id } = req.body;
    const campaign = await this.db.Campaign.findByPk(campaign_id);

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Queue campaign for sending
    await this.redis.rpush('email_queue', JSON.stringify({
      campaign_id,
      status: 'queued',
      queued_at: new Date()
    }));

    await campaign.update({ status: 'sending', sent_at: new Date() });

    res.json({ success: true, message: 'Campaign queued for sending' });
  }

  async getAnalytics(req, res) {
    const { campaign_id } = req.params;

    const analytics = await this.db.query(\`
      SELECT
        COUNT(DISTINCT recipient_id) as total_sent,
        COUNT(DISTINCT CASE WHEN opened_at IS NOT NULL THEN recipient_id END) as total_opened,
        COUNT(DISTINCT CASE WHEN clicked_at IS NOT NULL THEN recipient_id END) as total_clicked,
        COUNT(DISTINCT CASE WHEN converted_at IS NOT NULL THEN recipient_id END) as total_converted,
        AVG(EXTRACT(EPOCH FROM (opened_at - sent_at))) as avg_time_to_open
      FROM email_analytics
      WHERE campaign_id = $1
    \`, [campaign_id]);

    const stats = analytics.rows[0];
    stats.open_rate = (stats.total_opened / stats.total_sent * 100).toFixed(2);
    stats.click_rate = (stats.total_clicked / stats.total_opened * 100).toFixed(2);
    stats.conversion_rate = (stats.total_converted / stats.total_sent * 100).toFixed(2);

    res.json(stats);
  }
}

module.exports = CampaignController;`
        }
      ],
      models: [
        {
          name: 'Campaign',
          code: `const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Campaign', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: false
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    ai_generated_content: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    segment: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    template_id: {
      type: DataTypes.UUID,
      allowNull: true
    },
    ab_test_enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    status: {
      type: DataTypes.ENUM('draft', 'scheduled', 'sending', 'sent', 'cancelled'),
      defaultValue: 'draft'
    },
    sent_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: false
    }
  }, {
    tableName: 'email_campaigns',
    timestamps: true
  });
};`
        }
      ],
      components: [
        {
          name: 'CampaignBuilder',
          code: `import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Send } from 'lucide-react';

const CampaignBuilder = () => {
  const [prompt, setPrompt] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [loading, setLoading] = useState(false);

  const generateWithAI = async () => {
    setLoading(true);
    const response = await fetch('/api/campaigns/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    const data = await response.json();
    setGeneratedContent(data.content);
    setLoading(false);
  };

  return (
    <div className="campaign-builder">
      <Card>
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-4">Create Email Campaign</h2>

          <div className="mb-4">
            <label className="block mb-2">What's your campaign about?</label>
            <Input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., Summer sale on outdoor furniture with 30% off"
            />
          </div>

          <Button onClick={generateWithAI} disabled={loading}>
            <Sparkles className="w-4 h-4 mr-2" />
            {loading ? 'Generating...' : 'Generate with AI'}
          </Button>

          {generatedContent && (
            <div className="mt-6">
              <h3 className="font-semibold mb-2">Generated Content:</h3>
              <div
                className="border p-4 rounded bg-gray-50"
                dangerouslySetInnerHTML={{ __html: generatedContent }}
              />
              <Button className="mt-4">
                <Send className="w-4 h-4 mr-2" />
                Send Campaign
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CampaignBuilder;`
        }
      ],
      adminNavigation: {
        enabled: true,
        label: 'Email Campaigns',
        icon: 'Mail',
        route: '/admin/campaigns',
        order: 55,
        parentKey: null,
        description: 'AI-powered email marketing campaigns'
      }
    },
    hooks: [
      {
        hook_name: 'email.send',
        priority: 10,
        handler_code: `async function emailSendHook(email) {
  // Track email analytics
  await this.db.EmailAnalytics.create({
    campaign_id: email.campaign_id,
    recipient_id: email.recipient_id,
    sent_at: new Date()
  });
  return email;
}`
      }
    ],
    events: [
      {
        event_name: 'email.opened',
        listener_code: `async function onEmailOpened(data) {
  await this.db.EmailAnalytics.update(
    { opened_at: new Date() },
    { where: { campaign_id: data.campaign_id, recipient_id: data.recipient_id } }
  );
}`
      },
      {
        event_name: 'email.clicked',
        listener_code: `async function onEmailClicked(data) {
  await this.db.EmailAnalytics.update(
    { clicked_at: new Date(), clicked_link: data.link },
    { where: { campaign_id: data.campaign_id, recipient_id: data.recipient_id } }
  );
}`
      }
    ]
  }
];

async function seedExamplePlugins() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    for (const plugin of examplePlugins) {
      // Generate ID from slug
      const id = `${plugin.store_id}-${plugin.slug}`;

      // Build manifest with all plugin data
      const manifest = {
        name: plugin.name,
        slug: plugin.slug,
        version: plugin.version,
        author: plugin.author,
        mode: plugin.plugin_structure.mode,
        store_id: plugin.store_id,
        generated_by_ai: plugin.generated_by_ai,
        ...plugin.plugin_structure
      };

      // Build config with hooks and events
      const config = {
        hooks: plugin.hooks,
        events: plugin.events
      };

      const [results] = await sequelize.query(`
        INSERT INTO plugin_registry (
          id, name, version, description, author, category,
          status, type, manifest, config, source_code,
          created_at, updated_at
        )
        VALUES (
          :id, :name, :version, :description, :author, :category,
          'active', :type, :manifest, :config, :source_code,
          NOW(), NOW()
        )
        ON CONFLICT (id)
        DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          version = EXCLUDED.version,
          manifest = EXCLUDED.manifest,
          config = EXCLUDED.config,
          source_code = EXCLUDED.source_code,
          updated_at = NOW()
        RETURNING *
      `, {
        replacements: {
          id,
          name: plugin.name,
          version: plugin.version,
          description: plugin.description,
          author: plugin.author,
          category: plugin.category,
          type: plugin.generated_by_ai ? 'ai-generated' : 'custom',
          manifest: JSON.stringify(manifest),
          config: JSON.stringify(config),
          source_code: JSON.stringify(plugin.plugin_structure.generatedFiles || [])
        }
      });

      const wasCreated = results.length > 0;
      console.log(`✅ ${wasCreated ? 'Created/Updated' : 'Processed'}: ${plugin.name} (${plugin.plugin_structure.mode})`);
    }

    console.log('\n🎉 Successfully seeded 3 example plugins!');
    console.log('\nPlugins created:');
    console.log('1. Product Reviews (No-Code AI mode)');
    console.log('2. Loyalty Points System (Guided Builder mode)');
    console.log('3. Advanced Email Campaign Manager (Developer mode)');

  } catch (error) {
    console.error('❌ Error seeding plugins:', error);
  } finally {
    await sequelize.close();
  }
}

seedExamplePlugins();
