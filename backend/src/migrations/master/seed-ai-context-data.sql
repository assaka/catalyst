-- Seed AI Context Data for Master Database
-- Run this after create-ai-master-tables.sql

-- ============================================
-- AI CONTEXT DOCUMENTS - Knowledge Base
-- ============================================

-- Styling Intent Documents
INSERT INTO ai_context_documents (type, title, content, category, tags, priority, mode, is_active) VALUES
('intent_guide', 'Styling Intent - Colors',
'When users want to change colors, detect the STYLING intent.

KEYWORDS: color, background, text color, font color, primary, secondary, accent, dark, light, theme

EXAMPLES:
- "change the header background to blue" -> styling intent, target: header, property: background-color
- "make the button red" -> styling intent, target: button, property: background-color
- "use darker text" -> styling intent, target: body, property: color
- "change primary color to #FF5733" -> styling intent, target: :root, property: --primary-color

CSS PROPERTIES FOR COLORS:
- background-color: Element background
- color: Text color
- border-color: Border color
- --primary-color: CSS variable for primary theme color
- --secondary-color: CSS variable for secondary theme color
- --accent-color: CSS variable for accent/highlight color

RESPONSE FORMAT:
Generate CSS that targets the specific element and property.',
'styling', '["color", "background", "theme", "css"]', 90, 'all', true),

('intent_guide', 'Styling Intent - Typography',
'When users want to change fonts, text size, or typography.

KEYWORDS: font, text, size, bigger, smaller, bold, italic, heading, paragraph, typography

EXAMPLES:
- "make the title bigger" -> styling intent, target: h1/.title, property: font-size
- "use a different font" -> styling intent, target: body, property: font-family
- "bold the product name" -> styling intent, target: .product-name, property: font-weight

CSS PROPERTIES:
- font-size: Text size (use rem or px)
- font-family: Font typeface
- font-weight: Bold/normal (400, 500, 600, 700)
- line-height: Spacing between lines
- letter-spacing: Space between letters
- text-transform: uppercase, lowercase, capitalize',
'styling', '["font", "typography", "text", "size"]', 85, 'all', true),

('intent_guide', 'Styling Intent - Spacing & Layout',
'When users want to change spacing, padding, margins, or gaps.

KEYWORDS: spacing, padding, margin, gap, space, wider, narrower, tighter, looser

EXAMPLES:
- "add more space between products" -> styling intent, target: .product-grid, property: gap
- "reduce padding on cards" -> styling intent, target: .card, property: padding
- "more margin around the header" -> styling intent, target: header, property: margin

CSS PROPERTIES:
- padding: Inner spacing (padding-top, padding-bottom, etc.)
- margin: Outer spacing (margin-top, margin-bottom, etc.)
- gap: Space between grid/flex items
- row-gap, column-gap: Specific gap directions',
'styling', '["spacing", "padding", "margin", "layout"]', 85, 'all', true),

('intent_guide', 'Layout Modification Intent',
'When users want to move, reorder, swap, or remove elements.

KEYWORDS: move, swap, reorder, position, above, below, before, after, remove, hide, show

EXAMPLES:
- "move the SKU above the price" -> layout_modify intent, action: reorder
- "swap description and specifications" -> layout_modify intent, action: swap
- "remove the reviews section" -> layout_modify intent, action: remove
- "hide the stock indicator" -> layout_modify intent, action: hide

SLOT SYSTEM:
The storefront uses a slot-based layout system. Each page section has slots that can be reordered.
- product-info-main: Main product info area (title, price, sku, stock, etc.)
- product-details: Product details area (description, specs, reviews)

To reorder: Update the slot_order in page_slot_configurations table.',
'layout', '["layout", "reorder", "move", "slots"]', 90, 'all', true),

('intent_guide', 'Admin Entity Intent',
'When users want to modify admin settings, configurations, or data.

KEYWORDS: change, update, rename, create, delete, enable, disable, add, remove, set

ENTITY TYPES:
- product_tabs: Product page tabs (Description, Specifications, Reviews)
- store_settings: Store configuration (name, currency, timezone)
- seo_settings: SEO configuration (meta tags, sitemap)
- payment_methods: Payment gateway settings
- shipping_methods: Shipping options and rates
- categories: Product categories
- attributes: Product attributes
- coupons: Discount codes
- email_templates: Notification emails
- cms_pages: Static content pages
- languages: Supported languages
- translations: UI text translations

EXAMPLES:
- "rename the Specs tab to Technical Details" -> admin_entity, entity: product_tabs
- "change store currency to EUR" -> admin_entity, entity: store_settings
- "create a 20% discount code SUMMER20" -> admin_entity, entity: coupons
- "disable PayPal" -> admin_entity, entity: payment_methods',
'admin', '["admin", "settings", "entity", "configuration"]', 95, 'all', true),

('intent_guide', 'Translation Intent',
'When users want to translate or change UI text.

KEYWORDS: translate, translation, language, text, label, change text, rename label

EXAMPLES:
- "translate Add to Cart to German" -> translation intent
- "change the checkout button text" -> translation intent
- "rename Buy Now to Purchase" -> translation intent

TRANSLATION SYSTEM:
Translations are stored per language with keys like:
- product.add_to_cart
- checkout.place_order
- common.submit',
'translations', '["translation", "language", "i18n", "text"]', 80, 'all', true),

('intent_guide', 'Plugin Development Intent',
'When users want to create or modify plugins/extensions.

KEYWORDS: plugin, extension, custom, widget, component, create plugin, add feature

EXAMPLES:
- "create a countdown timer widget" -> plugin intent
- "add a newsletter popup" -> plugin intent
- "build a product comparison feature" -> plugin intent

PLUGIN STRUCTURE:
Plugins are JavaScript/JSX files that export:
- meta: Plugin metadata (name, version, description)
- slots: Where the plugin renders
- Component: React component
- hooks: Event handlers',
'plugins', '["plugin", "extension", "widget", "development"]', 75, 'developer', true),

-- Architecture Documents
('architecture', 'Storefront Slot System',
'The storefront uses a slot-based architecture for flexible layouts.

SLOT AREAS:
1. Header Slots: header-top, header-main, header-bottom
2. Product Page Slots:
   - product-info-main: SKU, title, price, stock, add-to-cart
   - product-info-sidebar: Related products, recently viewed
   - product-details: Description, specifications, reviews
3. Category Page Slots: category-header, product-grid, category-sidebar
4. Footer Slots: footer-top, footer-main, footer-bottom

SLOT CONFIGURATION TABLE: page_slot_configurations
- page_type: Which page (product, category, home)
- slot_area: Which slot area
- slot_name: Specific slot name
- slot_order: Display order (lower = first)
- is_visible: Show/hide slot
- custom_css: Per-slot styling

To reorder slots: UPDATE page_slot_configurations SET slot_order = X WHERE slot_name = Y',
'core', '["slots", "layout", "architecture", "pages"]', 100, 'all', true),

('architecture', 'CSS Variables System',
'The theme uses CSS variables for consistent styling.

ROOT VARIABLES (in :root):
--primary-color: Main brand color
--secondary-color: Secondary brand color
--accent-color: Highlight/accent color
--background-color: Page background
--text-color: Main text color
--heading-color: Heading text color
--border-color: Border color
--border-radius: Corner rounding
--font-family: Main font
--font-size-base: Base text size
--spacing-unit: Base spacing (usually 8px)

COMPONENT VARIABLES:
--header-bg: Header background
--header-text: Header text color
--button-bg: Button background
--button-text: Button text
--card-bg: Card background
--card-shadow: Card shadow

To change theme: Update CSS variables in the theme settings or custom CSS.',
'core', '["css", "variables", "theme", "styling"]', 95, 'all', true),

('best_practices', 'AI Response Guidelines',
'Guidelines for generating AI responses.

1. BE SPECIFIC: Always identify the exact element/selector
2. PROVIDE CSS: Include ready-to-use CSS code when styling
3. CONFIRM ACTIONS: Summarize what was changed
4. OFFER ALTERNATIVES: Suggest related improvements
5. STAY SCOPED: Only change what was requested
6. USE VARIABLES: Prefer CSS variables over hardcoded values
7. RESPONSIVE: Consider mobile when changing layouts

RESPONSE STRUCTURE:
1. Acknowledge the request
2. Explain what will be changed
3. Provide the code/changes
4. Confirm completion
5. Suggest related improvements (optional)',
'core', '["guidelines", "responses", "best-practices"]', 80, 'all', true);

-- ============================================
-- AI ENTITY DEFINITIONS - Admin Entities
-- ============================================

INSERT INTO ai_entity_definitions (entity_name, display_name, description, table_name, supported_operations, fields, primary_key, tenant_column, intent_keywords, example_prompts, category, priority, is_active) VALUES

('product_tabs', 'Product Tabs', 'Tabs shown on product detail pages (Description, Specifications, Reviews)',
'product_tabs',
'["list", "get", "create", "update", "delete"]',
'[{"name": "id", "type": "uuid", "required": false}, {"name": "name", "type": "string", "required": true}, {"name": "slug", "type": "string", "required": true}, {"name": "content_type", "type": "string", "required": true}, {"name": "order", "type": "integer", "required": false}, {"name": "is_active", "type": "boolean", "required": false}]',
'id', 'store_id',
'["tab", "tabs", "product tab", "description tab", "specs tab", "specifications", "reviews tab"]',
'["rename the specs tab", "add a new product tab", "reorder product tabs", "hide the reviews tab", "change tab name"]',
'products', 90, true),

('store_settings', 'Store Settings', 'General store configuration like name, currency, timezone',
'store_settings',
'["get", "update"]',
'[{"name": "store_name", "type": "string"}, {"name": "store_email", "type": "string"}, {"name": "currency", "type": "string"}, {"name": "timezone", "type": "string"}, {"name": "date_format", "type": "string"}, {"name": "weight_unit", "type": "string"}]',
'id', 'store_id',
'["store name", "currency", "timezone", "store settings", "shop name", "business name"]',
'["change store name", "update currency to EUR", "set timezone to UTC"]',
'settings', 95, true),

('seo_settings', 'SEO Settings', 'Search engine optimization settings',
'seo_settings',
'["get", "update"]',
'[{"name": "meta_title", "type": "string"}, {"name": "meta_description", "type": "string"}, {"name": "meta_keywords", "type": "string"}, {"name": "og_image", "type": "string"}, {"name": "robots_txt", "type": "text"}, {"name": "sitemap_enabled", "type": "boolean"}]',
'id', 'store_id',
'["seo", "meta", "title", "description", "keywords", "sitemap", "robots"]',
'["update meta title", "change SEO description", "enable sitemap"]',
'settings', 85, true),

('payment_methods', 'Payment Methods', 'Payment gateway configurations',
'payment_methods',
'["list", "get", "update"]',
'[{"name": "id", "type": "uuid"}, {"name": "name", "type": "string"}, {"name": "provider", "type": "string"}, {"name": "is_active", "type": "boolean"}, {"name": "is_default", "type": "boolean"}, {"name": "settings", "type": "json"}]',
'id', 'store_id',
'["payment", "payments", "paypal", "stripe", "credit card", "payment method", "checkout"]',
'["enable PayPal", "disable Stripe", "set default payment method", "configure payment gateway"]',
'settings', 85, true),

('shipping_methods', 'Shipping Methods', 'Shipping options and rates',
'shipping_methods',
'["list", "get", "create", "update", "delete"]',
'[{"name": "id", "type": "uuid"}, {"name": "name", "type": "string"}, {"name": "description", "type": "string"}, {"name": "price", "type": "decimal"}, {"name": "is_active", "type": "boolean"}, {"name": "min_order", "type": "decimal"}, {"name": "max_order", "type": "decimal"}]',
'id', 'store_id',
'["shipping", "delivery", "shipping method", "shipping rate", "free shipping", "express"]',
'["add free shipping", "create express delivery option", "update shipping rates", "disable shipping method"]',
'settings', 80, true),

('categories', 'Categories', 'Product categories and hierarchy',
'categories',
'["list", "get", "create", "update", "delete"]',
'[{"name": "id", "type": "uuid"}, {"name": "name", "type": "string", "required": true}, {"name": "slug", "type": "string"}, {"name": "description", "type": "text"}, {"name": "parent_id", "type": "uuid"}, {"name": "image", "type": "string"}, {"name": "is_active", "type": "boolean"}]',
'id', 'store_id',
'["category", "categories", "product category", "collection", "department"]',
'["create a new category", "rename Electronics to Tech", "add subcategory", "delete category"]',
'products', 85, true),

('attributes', 'Product Attributes', 'Product attributes like Size, Color',
'product_attributes',
'["list", "get", "create", "update", "delete"]',
'[{"name": "id", "type": "uuid"}, {"name": "name", "type": "string", "required": true}, {"name": "slug", "type": "string"}, {"name": "type", "type": "string"}, {"name": "values", "type": "json"}, {"name": "is_filterable", "type": "boolean"}, {"name": "is_visible", "type": "boolean"}]',
'id', 'store_id',
'["attribute", "attributes", "size", "color", "variant", "option", "product attribute"]',
'["create Size attribute", "add Color options", "make attribute filterable"]',
'products', 75, true),

('coupons', 'Coupons', 'Discount codes and promotions',
'coupons',
'["list", "get", "create", "update", "delete"]',
'[{"name": "id", "type": "uuid"}, {"name": "code", "type": "string", "required": true}, {"name": "description", "type": "string"}, {"name": "discount_type", "type": "string", "required": true}, {"name": "discount_value", "type": "decimal", "required": true}, {"name": "min_order", "type": "decimal"}, {"name": "max_uses", "type": "integer"}, {"name": "starts_at", "type": "timestamp"}, {"name": "expires_at", "type": "timestamp"}, {"name": "is_active", "type": "boolean"}]',
'id', 'store_id',
'["coupon", "discount", "promo", "promotion", "discount code", "voucher", "sale"]',
'["create 20% discount code", "add coupon SUMMER20", "disable expired coupons", "create free shipping coupon"]',
'marketing', 90, true),

('email_templates', 'Email Templates', 'Notification email templates',
'email_templates',
'["list", "get", "update"]',
'[{"name": "id", "type": "uuid"}, {"name": "name", "type": "string"}, {"name": "slug", "type": "string"}, {"name": "subject", "type": "string"}, {"name": "body", "type": "text"}, {"name": "is_active", "type": "boolean"}]',
'id', 'store_id',
'["email", "template", "notification", "email template", "order confirmation", "welcome email"]',
'["edit order confirmation email", "update welcome email", "change email subject"]',
'settings', 70, true),

('cms_pages', 'CMS Pages', 'Static content pages (About, Contact, etc.)',
'cms_pages',
'["list", "get", "create", "update", "delete"]',
'[{"name": "id", "type": "uuid"}, {"name": "title", "type": "string", "required": true}, {"name": "slug", "type": "string"}, {"name": "content", "type": "text"}, {"name": "meta_title", "type": "string"}, {"name": "meta_description", "type": "string"}, {"name": "is_active", "type": "boolean"}]',
'id', 'store_id',
'["page", "cms", "content", "about", "contact", "faq", "terms", "privacy", "static page"]',
'["create About Us page", "edit Contact page", "add FAQ page", "update privacy policy"]',
'content', 75, true),

('languages', 'Languages', 'Supported store languages',
'languages',
'["list", "get", "create", "update", "delete"]',
'[{"name": "id", "type": "uuid"}, {"name": "code", "type": "string", "required": true}, {"name": "name", "type": "string", "required": true}, {"name": "is_default", "type": "boolean"}, {"name": "is_active", "type": "boolean"}]',
'id', 'store_id',
'["language", "languages", "locale", "translation", "multilingual", "german", "french", "spanish"]',
'["add German language", "enable French", "set default language", "disable language"]',
'translations', 80, true),

('tax_settings', 'Tax Settings', 'Tax rates and configuration',
'tax_settings',
'["list", "get", "create", "update", "delete"]',
'[{"name": "id", "type": "uuid"}, {"name": "name", "type": "string", "required": true}, {"name": "rate", "type": "decimal", "required": true}, {"name": "country", "type": "string"}, {"name": "region", "type": "string"}, {"name": "is_active", "type": "boolean"}]',
'id', 'store_id',
'["tax", "taxes", "vat", "sales tax", "tax rate", "tax settings"]',
'["add 19% VAT", "create tax rate for Germany", "update tax settings"]',
'settings', 70, true);

-- ============================================
-- AI CODE PATTERNS - Reusable Snippets
-- ============================================

INSERT INTO ai_code_patterns (name, pattern_type, description, code, language, framework, example_usage, tags, is_active) VALUES

('Change Element Color', 'css', 'Pattern for changing color of any element',
'.selector {
  background-color: #YOUR_COLOR;
  /* or for text: */
  color: #YOUR_COLOR;
}',
'css', 'css',
'Use this pattern to change background or text color of elements. Replace .selector with the target element class/id.',
'["color", "background", "styling"]', true),

('CSS Variables Theme', 'css', 'Pattern for updating theme via CSS variables',
':root {
  --primary-color: #YOUR_PRIMARY;
  --secondary-color: #YOUR_SECONDARY;
  --accent-color: #YOUR_ACCENT;
}',
'css', 'css',
'Update root CSS variables to change theme colors globally.',
'["theme", "variables", "colors"]', true),

('Responsive Font Size', 'css', 'Pattern for responsive typography',
'.element {
  font-size: clamp(1rem, 2vw + 0.5rem, 2rem);
  /* or fixed: */
  font-size: 1.25rem;
}',
'css', 'css',
'Use clamp() for responsive sizing or fixed rem/px values.',
'["font", "typography", "responsive"]', true),

('Slot Reorder Query', 'database', 'SQL pattern for reordering slots',
'UPDATE page_slot_configurations
SET slot_order = CASE
  WHEN slot_name = ''slot_a'' THEN 2
  WHEN slot_name = ''slot_b'' THEN 1
  ELSE slot_order
END
WHERE store_id = $1
AND page_type = ''product''
AND slot_area = ''product-info-main'';',
'sql', 'postgresql',
'Use this to swap or reorder slots. Adjust slot_name and slot_order values.',
'["slots", "reorder", "layout"]', true),

('Hide Element CSS', 'css', 'Pattern for hiding elements',
'.element-to-hide {
  display: none !important;
}
/* or for screen readers: */
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  clip: rect(0, 0, 0, 0);
}',
'css', 'css',
'Use display:none to hide completely, or visually-hidden for accessibility.',
'["hide", "visibility", "display"]', true),

('Button Styling', 'css', 'Common button style pattern',
'.button {
  background-color: var(--primary-color);
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: background-color 0.2s ease;
}
.button:hover {
  background-color: var(--primary-color-dark);
}',
'css', 'css',
'Standard button styling with hover effect.',
'["button", "styling", "hover"]', true),

('Card Component Style', 'css', 'Pattern for card/box components',
'.card {
  background: var(--card-bg, white);
  border-radius: var(--border-radius);
  box-shadow: var(--card-shadow, 0 2px 8px rgba(0,0,0,0.1));
  padding: 1.5rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}',
'css', 'css',
'Card component with shadow and hover effect.',
'["card", "component", "shadow"]', true),

('Grid Layout', 'css', 'Responsive grid pattern',
'.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
}',
'css', 'css',
'Responsive grid that auto-fills columns based on available space.',
'["grid", "layout", "responsive"]', true),

('Flexbox Center', 'css', 'Center content with flexbox',
'.flex-center {
  display: flex;
  justify-content: center;
  align-items: center;
}',
'css', 'css',
'Center content both horizontally and vertically.',
'["flexbox", "center", "alignment"]', true),

('Entity Update Response', 'successful_prompt', 'Successful entity update pattern',
'{"user_message": "rename the specs tab to Technical Details", "entity": "product_tabs", "operation": "update", "success": true}',
'json', 'ai-learning',
'Pattern for successful entity update operations.',
'["entity", "update", "successful"]', true);

-- ============================================
-- AI PLUGIN EXAMPLES - Code Examples
-- ============================================

INSERT INTO ai_plugin_examples (name, slug, description, category, complexity, code, features, use_cases, tags, is_active) VALUES

('Countdown Timer Widget', 'countdown-timer',
'A countdown timer plugin for sales and promotions',
'marketing', 'simple',
'export const meta = {
  name: "Countdown Timer",
  version: "1.0.0",
  description: "Display countdown to sales or events"
};

export const slots = ["header-top", "product-info-main"];

export function Component({ endDate, label }) {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(endDate));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(endDate));
    }, 1000);
    return () => clearInterval(timer);
  }, [endDate]);

  return (
    <div className="countdown-timer">
      <span className="countdown-label">{label}</span>
      <div className="countdown-digits">
        <span>{timeLeft.days}d</span>
        <span>{timeLeft.hours}h</span>
        <span>{timeLeft.minutes}m</span>
        <span>{timeLeft.seconds}s</span>
      </div>
    </div>
  );
}',
'["countdown", "timer", "animation"]',
'["flash sales", "product launches", "event promotions", "limited offers"]',
'["timer", "countdown", "sales", "urgency"]', true),

('Social Proof Badge', 'social-proof-badge',
'Shows recent purchases or views',
'marketing', 'simple',
'export const meta = {
  name: "Social Proof Badge",
  version: "1.0.0",
  description: "Display recent activity notifications"
};

export const slots = ["product-info-main"];

export function Component({ productId }) {
  const [activity, setActivity] = useState(null);

  useEffect(() => {
    // Fetch recent activity
    fetchRecentActivity(productId).then(setActivity);
  }, [productId]);

  if (!activity) return null;

  return (
    <div className="social-proof-badge">
      <span className="pulse-dot"></span>
      <span>{activity.count} people viewed this in the last hour</span>
    </div>
  );
}',
'["social proof", "notifications", "trust"]',
'["increase conversions", "build trust", "show popularity"]',
'["social", "proof", "trust", "conversion"]', true),

('Newsletter Popup', 'newsletter-popup',
'Email subscription popup with discount offer',
'marketing', 'intermediate',
'export const meta = {
  name: "Newsletter Popup",
  version: "1.0.0",
  description: "Capture emails with exit-intent popup"
};

export const hooks = {
  onPageLoad: (context) => {
    // Check if already subscribed
    if (localStorage.getItem("newsletter_subscribed")) return;

    // Exit intent detection
    document.addEventListener("mouseout", handleExitIntent);
  }
};

export function Component({ discount, title }) {
  const [email, setEmail] = useState("");
  const [isVisible, setIsVisible] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await subscribeNewsletter(email);
    localStorage.setItem("newsletter_subscribed", "true");
    setIsVisible(false);
  };

  return isVisible ? (
    <div className="newsletter-popup-overlay">
      <div className="newsletter-popup">
        <button onClick={() => setIsVisible(false)}>X</button>
        <h2>{title || "Get " + discount + " Off!"}</h2>
        <p>Subscribe to our newsletter</p>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
          />
          <button type="submit">Subscribe</button>
        </form>
      </div>
    </div>
  ) : null;
}',
'["popup", "email capture", "exit intent", "discount"]',
'["grow email list", "reduce bounce rate", "offer discounts"]',
'["newsletter", "popup", "email", "marketing"]', true),

('Product Comparison', 'product-comparison',
'Compare multiple products side by side',
'commerce', 'advanced',
'export const meta = {
  name: "Product Comparison",
  version: "1.0.0",
  description: "Compare products side by side"
};

export const slots = ["category-header"];

export function Component() {
  const [compareList, setCompareList] = useLocalStorage("compare_list", []);

  const addToCompare = (product) => {
    if (compareList.length >= 4) {
      alert("Max 4 products");
      return;
    }
    setCompareList([...compareList, product]);
  };

  return (
    <div className="product-comparison">
      <button onClick={() => setShowModal(true)}>
        Compare ({compareList.length})
      </button>
      {showModal && (
        <ComparisonTable products={compareList} />
      )}
    </div>
  );
}',
'["comparison table", "product attributes", "side by side"]',
'["help customers decide", "highlight differences", "feature comparison"]',
'["compare", "comparison", "products", "features"]', true);

-- Update usage counts for patterns
UPDATE ai_code_patterns SET usage_count = 5 WHERE pattern_type = 'css';
UPDATE ai_code_patterns SET usage_count = 3 WHERE pattern_type = 'database';
UPDATE ai_plugin_examples SET usage_count = 10 WHERE slug = 'countdown-timer';
UPDATE ai_plugin_examples SET usage_count = 8 WHERE slug = 'newsletter-popup';
