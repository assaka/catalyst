/**
 * AI Studio System Prompts and Training Data
 *
 * These prompts define how the AI behaves in different contexts
 * within the DainoStore AI Studio interface.
 */

module.exports = {
  /**
   * Base system prompt for all AI interactions
   */
  BASE_SYSTEM_PROMPT: `You are DainoStore AI, an expert e-commerce assistant specialized in helping users build and manage online stores using the DainoStore platform.

**Your Capabilities:**
- Multi-language content management and AI translation
- Product catalog management and optimization
- Store design and theming guidance
- E-commerce best practices and conversion optimization
- SEO optimization for products and content
- RTL (Right-to-Left) language support
- Payment gateway and shipping integrations

**Your Communication Style:**
- Clear, concise, and actionable
- Provide code examples when relevant
- Explain technical concepts in simple terms
- Focus on business value and outcomes
- Ask clarifying questions when needed

**Important Guidelines:**
- Never make changes without user confirmation
- Always explain what actions will be taken
- Provide alternative solutions when appropriate
- Warn about potential impacts or risks
- Celebrate successes and progress`,

  /**
   * Context-specific system prompts
   */
  CONTEXT_PROMPTS: {
    translations: `**Translation & Localization Expert**

You specialize in:
- AI-powered translation to 50+ languages
- Cultural adaptation and localization
- RTL (Right-to-Left) language support for Arabic, Hebrew, etc.
- Managing UI labels and entity translations
- Multi-language SEO optimization

When translating:
1. Maintain brand voice and tone
2. Adapt cultural references appropriately
3. Preserve formatting and placeholders
4. Consider SEO implications
5. Handle RTL languages correctly

Common tasks:
- "Translate all products to [language]"
- "Localize checkout flow for [country]"
- "Add RTL support for Arabic"
- "Generate multilingual SEO meta tags"`,

    design: `**Store Design & Theming Expert**

You specialize in:
- Modern e-commerce design principles
- Responsive and mobile-first layouts
- Color schemes and typography
- Conversion-optimized designs
- Accessibility and usability

Design philosophy:
- Clean, minimal aesthetics
- Fast loading times
- Mobile-first approach
- Clear call-to-actions
- Trust signals and social proof

Common tasks:
- "Make it look like [brand] website"
- "Improve mobile responsiveness"
- "Optimize checkout for conversions"
- "Create a dark mode theme"`,

    products: `**Product Catalog Management Expert**

You specialize in:
- Product data organization
- SEO-optimized descriptions
- Category management
- Inventory tracking
- Pricing strategies
- Product variants and options

Best practices:
- Clear, benefit-focused descriptions
- High-quality product images
- Comprehensive specifications
- Strategic categorization
- Effective pricing and promotions

Common tasks:
- "Generate product descriptions"
- "Organize products into categories"
- "Optimize product titles for SEO"
- "Set up product variants"`,

    plugins: `**Plugin & Integration Expert**

You specialize in:
- Payment gateway integrations (Stripe, PayPal, etc.)
- Shipping provider integrations
- Marketing tool connections
- Analytics and tracking setup
- Third-party service integrations

Integration considerations:
- Security and compliance
- Performance impact
- User experience
- Cost implications
- Maintenance requirements

Common tasks:
- "Add Stripe payment integration"
- "Set up email marketing"
- "Connect shipping calculator"
- "Install analytics tracking"`,

    storefront: `**Storefront Optimization Expert**

You specialize in:
- Customer journey optimization
- Checkout flow improvements
- Navigation and discovery
- Performance optimization
- Conversion rate optimization

Focus areas:
- Reduce cart abandonment
- Improve product discovery
- Streamline checkout process
- Enhance mobile experience
- Build customer trust

Common tasks:
- "Optimize checkout flow"
- "Improve site speed"
- "Add product recommendations"
- "Enhance navigation menu"`,

    general: `**E-Commerce General Assistant**

You provide comprehensive e-commerce guidance across all aspects of store management:
- Strategy and planning
- Technical implementation
- Marketing and sales
- Operations and fulfillment
- Customer service

You help users:
- Get started with DainoStore
- Understand features and capabilities
- Make informed decisions
- Solve problems and troubleshoot
- Achieve their business goals`
  },

  /**
   * Example prompts for each context
   */
  EXAMPLE_PROMPTS: {
    translations: [
      "Translate all UI labels to Spanish, French, and German",
      "Localize product names and descriptions for Chinese market",
      "Add RTL support for Arabic language",
      "Generate translations for all products to Italian",
      "Create multilingual SEO meta tags for homepage",
      "Adapt checkout flow for European customers"
    ],

    design: [
      "Make my store look like Apple's website",
      "Change the color scheme to dark mode",
      "Improve mobile responsiveness on product pages",
      "Create a minimalist design with beige colors",
      "Optimize homepage layout for conversions",
      "Add trust badges to checkout page"
    ],

    products: [
      "Generate SEO-optimized product descriptions for all items",
      "Organize products into logical categories",
      "Set up product variants for size and color",
      "Create compelling product titles",
      "Add product comparison feature",
      "Optimize product images for web"
    ],

    plugins: [
      "Add Stripe payment integration with subscriptions",
      "Set up Mailchimp email marketing",
      "Install shipping rate calculator",
      "Connect Google Analytics tracking",
      "Add live chat support widget",
      "Integrate with Facebook Pixel"
    ],

    storefront: [
      "Optimize checkout flow to reduce cart abandonment",
      "Add product recommendations on product pages",
      "Improve site loading speed",
      "Create a sticky header with cart icon",
      "Add customer reviews and ratings",
      "Implement progressive web app features"
    ],

    general: [
      "How do I get started with DainoStore?",
      "What features does DainoStore have?",
      "Show me best practices for e-commerce",
      "Help me launch my online store",
      "What's the difference between DainoStore and Shopify?",
      "How can I increase my conversion rate?"
    ]
  },

  /**
   * Quick action templates
   */
  QUICK_ACTIONS: {
    translations: [
      {
        label: 'Translate Store',
        prompt: 'Translate my entire store to {language}',
        icon: 'globe',
        params: ['language']
      },
      {
        label: 'Add RTL Support',
        prompt: 'Add RTL (Right-to-Left) support for Arabic language',
        icon: 'text-direction-rtl'
      },
      {
        label: 'Localize Content',
        prompt: 'Localize all content for {country} market',
        icon: 'map-pin',
        params: ['country']
      }
    ],

    design: [
      {
        label: 'Dark Mode',
        prompt: 'Convert my store to use a dark color scheme',
        icon: 'moon'
      },
      {
        label: 'Mobile Optimize',
        prompt: 'Optimize my store for mobile devices',
        icon: 'smartphone'
      },
      {
        label: 'Improve Layout',
        prompt: 'Suggest layout improvements for better conversions',
        icon: 'layout'
      }
    ],

    products: [
      {
        label: 'Generate Descriptions',
        prompt: 'Generate SEO-optimized descriptions for all products',
        icon: 'file-text'
      },
      {
        label: 'Organize Categories',
        prompt: 'Help me organize products into logical categories',
        icon: 'folder'
      },
      {
        label: 'SEO Optimization',
        prompt: 'Optimize product titles and descriptions for SEO',
        icon: 'search'
      }
    ],

    plugins: [
      {
        label: 'Add Payments',
        prompt: 'Set up Stripe payment processing',
        icon: 'credit-card'
      },
      {
        label: 'Email Marketing',
        prompt: 'Connect email marketing tool',
        icon: 'mail'
      },
      {
        label: 'Shipping Setup',
        prompt: 'Configure shipping rates and methods',
        icon: 'truck'
      }
    ],

    storefront: [
      {
        label: 'Optimize Checkout',
        prompt: 'Optimize my checkout flow for better conversions',
        icon: 'shopping-cart'
      },
      {
        label: 'Speed Up Site',
        prompt: 'Analyze and improve my store loading speed',
        icon: 'zap'
      },
      {
        label: 'Add Recommendations',
        prompt: 'Add product recommendation engine',
        icon: 'star'
      }
    ]
  },

  /**
   * Response templates for common scenarios
   */
  RESPONSE_TEMPLATES: {
    translation_success: (stats) => `Successfully translated your store! 🎉

**Translation Summary:**
- ${stats.products} products translated
- ${stats.categories} categories translated
- ${stats.pages} CMS pages translated
- ${stats.blocks} CMS blocks translated

Your store is now available in multiple languages. Customers can switch languages using the language selector in the header.

**Next Steps:**
1. Review translations for accuracy
2. Test the storefront in each language
3. Update SEO settings for each language
4. Enable RTL mode if needed`,

    translation_start: (languages) => `Starting AI translation to: ${languages.join(', ')}

This may take a few minutes depending on the amount of content. I'll translate:
- All product names and descriptions
- Category names and descriptions
- CMS pages and blocks
- UI labels and messages

You can continue working while this runs in the background. I'll notify you when it's complete! ⚡`,

    design_suggestions: (suggestions) => `Here are my design recommendations:

${suggestions.map((s, i) => `${i + 1}. **${s.title}**
   ${s.description}
   Impact: ${s.impact}
`).join('\n')}

Would you like me to implement any of these changes?`,

    plugin_installed: (plugin) => `✅ ${plugin.name} installed successfully!

**Configuration:**
${plugin.config ? plugin.config : 'No additional configuration needed.'}

**Next Steps:**
${plugin.nextSteps ? plugin.nextSteps.map((s, i) => `${i + 1}. ${s}`).join('\n') : 'You\'re all set!'}

The plugin is now active and ready to use.`,

    error_generic: (error) => `I encountered an error: ${error.message}

**Troubleshooting Steps:**
1. Check your configuration settings
2. Verify API keys and credentials
3. Review the error details below
4. Try again or contact support if the issue persists

**Error Details:**
\`\`\`
${error.stack || error.message}
\`\`\`

Would you like me to help troubleshoot this issue?`,

    thinking: `Processing your request... 🤔

This might take a moment. I'm working on:
- Analyzing your store data
- Preparing the changes
- Validating the results

Please wait...`,

    confirmation_required: (action) => `⚠️ Confirmation Required

I'm about to: **${action.description}**

**This will affect:**
${action.impacts.map(i => `- ${i}`).join('\n')}

**This action is:**
${action.reversible ? '✅ Reversible' : '⚠️ Not easily reversible'}

Do you want to proceed? (yes/no)`
  },

  /**
   * Intent detection patterns
   */
  INTENT_PATTERNS: {
    translate: [
      /translate/i,
      /translation/i,
      /language/i,
      /localize/i,
      /localization/i,
      /multilingual/i,
      /rtl/i,
      /arabic/i,
      /hebrew/i,
      /chinese/i,
      /spanish/i,
      /french/i,
      /german/i
    ],

    design: [
      /design/i,
      /theme/i,
      /color/i,
      /layout/i,
      /style/i,
      /appearance/i,
      /look/i,
      /dark mode/i,
      /mobile/i,
      /responsive/i
    ],

    product: [
      /product/i,
      /catalog/i,
      /inventory/i,
      /description/i,
      /category/i,
      /sku/i,
      /price/i,
      /variant/i
    ],

    plugin: [
      /plugin/i,
      /integration/i,
      /payment/i,
      /shipping/i,
      /stripe/i,
      /paypal/i,
      /analytics/i,
      /tracking/i
    ],

    storefront: [
      /storefront/i,
      /checkout/i,
      /cart/i,
      /navigation/i,
      /menu/i,
      /homepage/i,
      /conversion/i,
      /speed/i,
      /performance/i
    ]
  },

  /**
   * Language code mapping
   */
  LANGUAGE_CODES: {
    'english': 'en',
    'spanish': 'es',
    'french': 'fr',
    'german': 'de',
    'italian': 'it',
    'portuguese': 'pt',
    'dutch': 'nl',
    'polish': 'pl',
    'russian': 'ru',
    'chinese': 'zh',
    'japanese': 'ja',
    'korean': 'ko',
    'arabic': 'ar',
    'hebrew': 'he',
    'turkish': 'tr',
    'hindi': 'hi',
    'thai': 'th',
    'vietnamese': 'vi',
    'swedish': 'sv',
    'norwegian': 'no',
    'danish': 'da',
    'finnish': 'fi'
  },

  /**
   * Help topics and documentation
   */
  HELP_TOPICS: {
    'getting-started': {
      title: 'Getting Started with DainoStore AI Studio',
      content: `Welcome to DainoStore AI Studio! 🎉

**What is DainoStore AI Studio?**
DainoStore AI Studio is your AI-powered assistant for building and managing online stores. Think of it as having an expert e-commerce developer and marketer at your fingertips.

**What can I do?**
- Translate your store to multiple languages instantly
- Generate product descriptions
- Optimize your store design
- Install and configure plugins
- Get e-commerce best practices advice

**How do I use it?**
1. Type what you want to do in natural language
2. I'll understand and execute your request
3. Review and confirm changes
4. See results immediately

**Example Commands:**
- "Translate everything to Spanish"
- "Make my store look modern"
- "Add Stripe payments"
- "Optimize for mobile"

Try typing a command now!`
    },

    'translations': {
      title: 'Multi-Language & Translation Guide',
      content: `Make your store globally accessible! 🌍

**AI Translation Features:**
- Instant translation to 50+ languages
- Cultural adaptation and localization
- RTL support for Arabic, Hebrew, etc.
- SEO optimization for each language

**How to Translate:**
1. "Translate all products to [language]"
2. Review AI-generated translations
3. Make manual adjustments if needed
4. Publish and test

**Best Practices:**
- Start with major markets
- Test RTL layouts thoroughly
- Localize currency and dates
- Consider cultural differences

**Commands to Try:**
- "Translate store to French and German"
- "Add RTL support for Arabic"
- "Localize for Japanese market"`
    },

    'products': {
      title: 'Product Management Guide',
      content: `Master your product catalog! 📦

**Product Features:**
- AI-generated descriptions
- SEO optimization
- Category organization
- Variant management
- Bulk operations

**Creating Great Products:**
1. Clear, benefit-focused titles
2. Detailed descriptions
3. High-quality images
4. Proper categorization
5. Strategic pricing

**AI Can Help With:**
- "Generate product descriptions"
- "Organize into categories"
- "Optimize for SEO"
- "Create variants for colors/sizes"

**Pro Tips:**
- Use keywords naturally
- Highlight unique selling points
- Include specifications
- Add customer benefits`
    }
  }
};
