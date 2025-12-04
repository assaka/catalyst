-- Seed Event Actions Plugin AI Context
-- Adds plugin examples, context documents, and code patterns for AI to generate event-driven plugins
-- This enables the AI chat to generate event-driven plugins when users ask:
--   "create a plugin that shows a modal when cart is empty"
--   "add a 20% off coupon popup for empty carts"
--   "create exit intent popup with discount"
--
-- SAFE TO RE-RUN: Uses ON CONFLICT DO NOTHING / DO UPDATE

-- =====================================================
-- 1. AI PLUGIN EXAMPLE: Event Actions Plugin
-- This is the main example the AI will use as a template
-- =====================================================
INSERT INTO ai_plugin_examples (
    name, slug, description, category, complexity, code, files, features, use_cases, tags, is_template, is_active, rating
) VALUES (
    'Event Actions - DB-Driven Modals & Coupons',
    'event-actions-modals-coupons',
    'Database-driven event triggers that show modals, apply coupons, notifications when specific storefront events occur (empty cart, checkout start, exit intent, product view, etc.). All configuration stored in plugin_data for 100% DB-driven behavior.',
    'marketing',
    'medium',
    $CODE$
// Event Actions Plugin - DB-Driven Triggers & Actions
// Shows modals, applies coupons, notifications based on storefront events

// ============================================
// PLUGIN REGISTRY ENTRY
// ============================================
const pluginManifest = {
    name: 'Event Actions',
    slug: 'event-actions',
    version: '1.0.0',
    description: 'AI-driven event triggers with modals, coupons, and notifications',
    author: 'AI Generator',
    category: 'marketing',
    mode: 'developer',
    features: [
        { type: 'api_endpoint', config: { path: '/triggers', methods: ['GET', 'POST', 'PUT', 'DELETE'] } },
        { type: 'api_endpoint', config: { path: '/actions', methods: ['GET', 'POST', 'PUT', 'DELETE'] } },
        { type: 'api_endpoint', config: { path: '/evaluate', methods: ['POST'] } },
        { type: 'webhook', config: { hook: 'cart.viewed', priority: 5 } },
        { type: 'webhook', config: { hook: 'checkout.start', priority: 5 } }
    ]
};

// ============================================
// EVENTS - Listen to storefront events
// ============================================
// File: events/cart_viewed.js
export default async function onCartViewed(data) {
    // Evaluate triggers when cart is viewed
    const response = await fetch('/api/plugins/event-actions/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            eventType: 'cart.view',
            context: {
                cart_items_count: data.items?.length || 0,
                cart_total: data.total || 0,
                session_id: sessionStorage.getItem('session_id')
            }
        })
    });

    const result = await response.json();
    if (result.actions?.length > 0) {
        // Execute first action (usually show_modal)
        executeAction(result.actions[0], result.trigger);
    }
}

function executeAction(action, trigger) {
    if (action.action_type === 'show_modal') {
        window.dispatchEvent(new CustomEvent('eventActionShowModal', {
            detail: {
                ...action.modal_config,
                coupon_config: action.coupon_config,
                trigger_id: trigger.id
            }
        }));
    }
}

// ============================================
// WIDGET - Modal Component (React.createElement)
// ============================================
// File: widgets/EventActionModal.jsx
function EventActionModalWidget({ config }) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [modalData, setModalData] = React.useState(null);

    React.useEffect(() => {
        const handleShow = (e) => {
            setModalData(e.detail);
            setIsOpen(true);
        };
        window.addEventListener('eventActionShowModal', handleShow);
        return () => window.removeEventListener('eventActionShowModal', handleShow);
    }, []);

    if (!isOpen || !modalData) return null;

    const handleButton = (btn) => {
        if (btn.action === 'apply_coupon') {
            window.__appliedCoupon = {
                code: btn.coupon_code,
                discount_type: modalData.coupon_config?.discount_type,
                discount_value: modalData.coupon_config?.discount_value
            };
            window.dispatchEvent(new CustomEvent('couponApplied', { detail: window.__appliedCoupon }));
        }
        if (btn.action === 'redirect') window.location.href = btn.url;
        setIsOpen(false);
    };

    return React.createElement('div', {
        className: 'fixed inset-0 z-50 flex items-center justify-center bg-black/50'
    },
        React.createElement('div', { className: 'bg-white rounded-xl p-6 max-w-md shadow-2xl' },
            React.createElement('h2', { className: 'text-xl font-bold mb-2 text-center' }, modalData.title),
            React.createElement('p', { className: 'text-gray-600 text-center mb-4' }, modalData.message),
            modalData.coupon_code && React.createElement('div', { className: 'bg-gray-100 p-3 rounded mb-4 text-center' },
                React.createElement('p', { className: 'text-xs uppercase' }, 'Your code'),
                React.createElement('p', { className: 'text-2xl font-mono font-bold' }, modalData.coupon_code)
            ),
            React.createElement('div', { className: 'flex flex-col gap-2' },
                modalData.buttons?.map((btn, i) => React.createElement('button', {
                    key: i,
                    onClick: () => handleButton(btn),
                    className: btn.style === 'primary' ? 'bg-blue-600 text-white py-2 rounded' : 'text-gray-500'
                }, btn.text))
            )
        )
    );
}
export default EventActionModalWidget;

// ============================================
// CONTROLLERS - API Endpoints
// ============================================
// File: controllers/evaluate.js
async function evaluate(req, res, { pluginData }) {
    const { eventType, context } = req.body;
    const triggers = await pluginData.get('triggers') || [];
    const actions = await pluginData.get('actions') || [];

    // Find matching trigger
    const trigger = triggers.find(t => {
        if (!t.is_enabled || t.event_type !== eventType) return false;
        // Check conditions
        for (const [field, rule] of Object.entries(t.conditions || {})) {
            if (rule.operator === '==' && context[field] !== rule.value) return false;
            if (rule.operator === '>' && context[field] <= rule.value) return false;
            if (rule.operator === '<' && context[field] >= rule.value) return false;
        }
        return true;
    });

    if (!trigger) return res.json({ actions: [] });

    const triggerActions = actions.filter(a => a.trigger_id === trigger.id && a.is_enabled);
    res.json({ trigger, actions: triggerActions });
}

// ============================================
// SAMPLE DATA - Empty Cart 20% Off
// ============================================
const sampleTrigger = {
    id: 'trigger_empty_cart',
    name: 'Empty Cart Offer',
    slug: 'empty-cart-20-off',
    event_type: 'cart.view',
    conditions: { cart_items_count: { operator: '==', value: 0 } },
    show_once_per_session: true,
    is_enabled: true
};

const sampleAction = {
    id: 'action_empty_cart_modal',
    trigger_id: 'trigger_empty_cart',
    action_type: 'show_modal',
    modal_config: {
        title: 'Your cart is empty!',
        message: "Here's 20% off to get started!",
        buttons: [
            { text: 'Claim 20% Off', action: 'apply_coupon', coupon_code: 'EMPTYCART20', style: 'primary' },
            { text: 'Browse Products', action: 'redirect', url: '/products', style: 'secondary' }
        ]
    },
    coupon_config: { code: 'EMPTYCART20', discount_type: 'percentage', discount_value: 20 },
    is_enabled: true
};
$CODE$,
    '[]'::jsonb,
    '["Event listeners", "DB-driven triggers", "Modal popups", "Coupon generation", "Session tracking", "Conversion logging"]'::jsonb,
    '["Empty cart recovery", "Checkout abandonment", "Exit intent popups", "First-time visitor offers", "Loyalty rewards", "Flash sales"]'::jsonb,
    '["marketing", "modals", "coupons", "events", "triggers", "cart", "checkout", "promotions"]'::jsonb,
    true,
    true,
    4.8
) ON CONFLICT (slug) DO UPDATE SET
    code = EXCLUDED.code,
    features = EXCLUDED.features,
    use_cases = EXCLUDED.use_cases,
    updated_at = NOW();

-- =====================================================
-- 2. AI CONTEXT DOCUMENTS
-- =====================================================

-- Document: Event Actions Architecture
INSERT INTO ai_context_documents (type, title, content, category, tags, priority, mode, is_active) VALUES (
    'architecture',
    'Event Actions Plugin Architecture',
    $DOC$# Event Actions Plugin Architecture

## Overview
Event Actions is a DB-driven system for creating promotional triggers that respond to storefront events.

## Key Components

### 1. Triggers (plugin_data: 'triggers')
Define WHEN an action fires:
- **event_type**: cart.view, checkout.start, product.view, exit.intent, page.view
- **conditions**: JSON rules like `{"cart_items_count": {"operator": "==", "value": 0}}`
- **targeting**: User type, first purchase, page filters
- **frequency**: show_once_per_session, max_displays_per_user, cooldown_hours

### 2. Actions (plugin_data: 'actions')
Define WHAT happens:
- **show_modal**: Popup with title, message, buttons, coupon code
- **apply_coupon**: Auto-apply discount code
- **show_notification**: Toast/banner message
- **redirect**: Navigate to URL
- **run_script**: Execute custom JavaScript

### 3. Events (plugin_events)
Listen to storefront events and evaluate triggers:
- cart.viewed → check for empty cart triggers
- checkout.start → check for checkout abandonment triggers
- product.view → check for product-specific offers
- exit.intent → check for exit popup triggers

### 4. Widget (plugin_widgets)
React component that renders modals using React.createElement (no JSX at runtime).

## Data Storage
All configuration stored in `plugin_data` table:
- triggers: Array of trigger definitions
- actions: Array of action definitions
- logs: Array of display/conversion logs

## Event Types
| Event | When Fired | Common Use |
|-------|-----------|------------|
| cart.view | User views cart | Empty cart offers |
| cart.empty | Cart has 0 items | Recovery offers |
| checkout.start | Begin checkout | Upsells |
| exit.intent | Mouse leaves page | Exit popups |
| product.view | View product | Related offers |
| page.view | Any page load | Welcome messages |

## Condition Operators
- `==` : Equals
- `!=` : Not equals
- `>` : Greater than
- `<` : Less than
- `>=` : Greater or equal
- `<=` : Less or equal
- `contains` : Array/string contains
- `in` : Value in array
$DOC$,
    'plugins',
    '["event-actions", "triggers", "modals", "coupons", "marketing"]'::jsonb,
    95,
    'all',
    true
) ON CONFLICT DO NOTHING;

-- Document: Creating Event Triggers
INSERT INTO ai_context_documents (type, title, content, category, tags, priority, mode, is_active) VALUES (
    'tutorial',
    'Creating Event Triggers for Promotions',
    $DOC$# Creating Event Triggers for Promotions

## Step 1: Define Your Trigger
Store in plugin_data with key 'triggers':

```javascript
const trigger = {
    id: 'trigger_' + Date.now(),
    name: 'Empty Cart 20% Off',
    slug: 'empty-cart-20-off',
    event_type: 'cart.view',  // When to check
    conditions: {
        cart_items_count: { operator: '==', value: 0 }  // Cart must be empty
    },
    targeting: {
        user_type: 'all',  // or 'guest', 'logged_in'
        exclude_converted: true  // Don't show if already converted
    },
    show_once_per_session: true,
    priority: 10,
    is_enabled: true
};
```

## Step 2: Define Your Action
Store in plugin_data with key 'actions':

```javascript
const action = {
    id: 'action_' + Date.now(),
    trigger_id: trigger.id,  // Link to trigger
    action_type: 'show_modal',
    modal_config: {
        title: 'Your cart is empty!',
        message: "Here's 20% off your first purchase",
        style: { position: 'center', theme: 'light' },
        buttons: [
            { text: 'Claim 20% Off', action: 'apply_coupon', coupon_code: 'EMPTY20', style: 'primary' },
            { text: 'No thanks', action: 'dismiss', style: 'link' }
        ]
    },
    coupon_config: {
        code: 'EMPTY20',
        discount_type: 'percentage',
        discount_value: 20
    },
    is_enabled: true
};
```

## Step 3: Listen to Events
Create event listener in plugin_events:

```javascript
// events/cart_viewed.js
export default async function onCartViewed(data) {
    const response = await fetch('/api/plugins/YOUR-PLUGIN/evaluate', {
        method: 'POST',
        body: JSON.stringify({
            eventType: 'cart.view',
            context: { cart_items_count: data.items?.length || 0 }
        })
    });
    const { actions } = await response.json();
    if (actions.length > 0) {
        window.dispatchEvent(new CustomEvent('showPromoModal', { detail: actions[0] }));
    }
}
```

## Common Trigger Examples

### Exit Intent Popup
```javascript
{ event_type: 'exit.intent', conditions: {}, show_once_per_session: true }
```

### Checkout Abandonment
```javascript
{ event_type: 'checkout.start', conditions: { cart_total: { operator: '>', value: 50 } } }
```

### First-Time Visitor
```javascript
{ event_type: 'page.view', targeting: { first_visit: true } }
```

### Cart Value Threshold
```javascript
{ event_type: 'cart.view', conditions: { cart_total: { operator: '<', value: 100 } } }
```
$DOC$,
    'plugins',
    '["tutorial", "triggers", "events", "promotions", "modals"]'::jsonb,
    90,
    'all',
    true
) ON CONFLICT DO NOTHING;

-- Document: Plugin Generation Rules (HIGH PRIORITY - MUST FOLLOW)
INSERT INTO ai_context_documents (type, title, content, category, tags, priority, mode, is_active) VALUES (
    'rules',
    'Plugin Generation Rules - MUST FOLLOW',
    $DOC$# CRITICAL: Plugin Generation Rules

## RULE 1: NEVER ASK QUESTIONS - USE SENSIBLE DEFAULTS
When a user asks to create a plugin, IMMEDIATELY generate it. Do NOT ask:
- "What do you want to call this plugin?" → Generate a name from the description
- "Which slot do you want?" → Use the most appropriate slot (cart_page for cart, checkout for checkout)
- "What features do you want?" → Infer features from the description

## RULE 2: GENERATE COMPLETE DATABASE ENTRIES
Return a JSON response with complete database INSERT statements for ALL required tables:

```json
{
  "type": "plugin_generation",
  "plugin": {
    "registry": {
      "name": "Coupon Modal",
      "slug": "coupon-modal",
      "description": "Shows a coupon modal when cart is empty",
      "category": "marketing",
      "version": "1.0.0"
    },
    "widgets": [{
      "name": "CouponModalWidget",
      "slot": "cart_page",
      "code": "function CouponModalWidget({ config }) { ... }"
    }],
    "events": [{
      "name": "onCartViewed",
      "event_type": "cart.view",
      "code": "export default async function onCartViewed(data) { ... }"
    }],
    "data": [{
      "key": "triggers",
      "value": [{ "id": "trigger_1", "event_type": "cart.view", "conditions": {"cart_items_count": {"operator": "==", "value": 0}} }]
    }, {
      "key": "actions",
      "value": [{ "id": "action_1", "trigger_id": "trigger_1", "action_type": "show_modal", "modal_config": {...} }]
    }]
  },
  "explanation": "Created a coupon modal plugin that shows 20% off when cart is empty"
}
```

## RULE 3: DEFAULT SLOT MAPPINGS
| Feature Type | Default Slot |
|-------------|--------------|
| Cart features | cart_page |
| Checkout features | checkout |
| Product features | product_page |
| Header features | header |
| Site-wide modals | global |
| Popups/Banners | global |

## RULE 4: DEFAULT COUPON STRUCTURE
```json
{
  "code": "SAVE20",
  "discount_type": "percentage",
  "discount_value": 20,
  "auto_apply": false
}
```

## RULE 5: DEFAULT MODAL STRUCTURE
```json
{
  "title": "Special Offer!",
  "message": "Description of the offer",
  "style": { "position": "center", "theme": "light", "size": "medium" },
  "buttons": [
    { "text": "Claim Offer", "style": "primary", "action": "apply_coupon" },
    { "text": "No Thanks", "style": "ghost", "action": "close" }
  ]
}
```

## EXAMPLE USER REQUESTS AND RESPONSES

**User:** "create a coupon plugin"
**AI Response:** Generate a complete coupon plugin with:
- Widget to display coupon code on cart page
- Event listener for cart.view
- Default 10% discount coupon
- Modal with "Apply Coupon" button

**User:** "show modal in cart when no products with 20% coupon"
**AI Response:** Generate:
- Trigger: event_type=cart.view, conditions={cart_items_count: {operator: "==", value: 0}}
- Action: show_modal with 20% coupon code
- Widget: Modal component for cart_page slot

**User:** "exit intent popup with discount"
**AI Response:** Generate:
- Trigger: event_type=exit.intent
- Action: show_modal with discount coupon
- Widget: Modal component for global slot
$DOC$,
    'core',
    '["rules", "generation", "defaults", "critical"]'::jsonb,
    100,
    'all',
    true
) ON CONFLICT DO NOTHING;

-- =====================================================
-- 3. CODE PATTERNS
-- =====================================================

-- Pattern: Event Listener for Triggers
INSERT INTO ai_code_patterns (name, pattern_type, description, code, language, framework, tags, is_active) VALUES (
    'Event Trigger Listener',
    'event-listener',
    'Listen to storefront events and evaluate triggers from plugin_data',
    $PATTERN$
// events/cart_viewed.js - Listen for cart view event
export default async function onCartViewed(data) {
    try {
        const response = await fetch('/api/plugins/{{PLUGIN_SLUG}}/evaluate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                eventType: 'cart.view',
                context: {
                    cart_items_count: data.items?.length || 0,
                    cart_total: data.total || 0,
                    cart_subtotal: data.subtotal || 0,
                    session_id: sessionStorage.getItem('event_session_id') || 'session_' + Date.now()
                }
            })
        });

        const result = await response.json();

        if (result.actions && result.actions.length > 0) {
            for (const action of result.actions) {
                executeAction(action, result.trigger);
            }
        }
    } catch (error) {
        console.error('Error evaluating event:', error);
    }
}

function executeAction(action, trigger) {
    switch (action.action_type) {
        case 'show_modal':
            window.dispatchEvent(new CustomEvent('eventActionShowModal', {
                detail: { ...action.modal_config, coupon_config: action.coupon_config, trigger_id: trigger.id }
            }));
            break;
        case 'apply_coupon':
            if (action.coupon_config?.auto_apply) {
                window.dispatchEvent(new CustomEvent('applyCoupon', { detail: action.coupon_config }));
            }
            break;
        case 'redirect':
            if (action.redirect_config?.url) {
                window.location.href = action.redirect_config.url;
            }
            break;
    }
}
$PATTERN$,
    'javascript',
    'react',
    '["events", "triggers", "cart", "evaluation"]'::jsonb,
    true
) ON CONFLICT DO NOTHING;

-- Pattern: Modal Widget (React.createElement)
INSERT INTO ai_code_patterns (name, pattern_type, description, code, language, framework, tags, is_active) VALUES (
    'Promotional Modal Widget',
    'widget',
    'React modal component using createElement for runtime rendering with coupon support',
    $PATTERN$
// widgets/PromoModal.jsx - NO JSX, use React.createElement
function PromoModalWidget({ config, slotData }) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [modalData, setModalData] = React.useState(null);

    React.useEffect(() => {
        const handleShowModal = (event) => {
            setModalData(event.detail);
            setIsOpen(true);
        };
        window.addEventListener('eventActionShowModal', handleShowModal);
        return () => window.removeEventListener('eventActionShowModal', handleShowModal);
    }, []);

    const handleButtonClick = (button) => {
        if (button.action === 'apply_coupon' && button.coupon_code) {
            window.__appliedCoupon = {
                code: button.coupon_code,
                discount_type: modalData.coupon_config?.discount_type || 'percentage',
                discount_value: modalData.coupon_config?.discount_value || 0
            };
            window.dispatchEvent(new CustomEvent('couponApplied', { detail: window.__appliedCoupon }));
        }
        if (button.action === 'redirect' && button.url) {
            window.location.href = button.url;
        }
        setIsOpen(false);
    };

    if (!isOpen || !modalData) return null;

    const { title, message, buttons = [], style = {} } = modalData;
    const theme = style.theme || 'light';

    return React.createElement('div', {
        className: 'fixed inset-0 z-50 flex items-center justify-center',
        style: { backgroundColor: 'rgba(0,0,0,0.5)' },
        onClick: () => setIsOpen(false)
    },
        React.createElement('div', {
            className: (theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900') + ' rounded-xl shadow-2xl max-w-md w-full mx-4 p-6',
            onClick: (e) => e.stopPropagation()
        },
            title && React.createElement('h2', { className: 'text-xl font-bold mb-2 text-center' }, title),
            message && React.createElement('p', { className: 'text-center mb-4 text-gray-600' }, message),
            modalData.coupon_code && React.createElement('div', { className: 'mb-4 p-3 rounded-lg text-center bg-gray-100' },
                React.createElement('p', { className: 'text-xs uppercase mb-1' }, 'Your coupon code'),
                React.createElement('p', { className: 'text-2xl font-bold font-mono' }, modalData.coupon_code)
            ),
            React.createElement('div', { className: 'flex flex-col gap-2' },
                buttons.map((btn, i) => React.createElement('button', {
                    key: i,
                    onClick: () => handleButtonClick(btn),
                    className: btn.style === 'primary'
                        ? 'w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700'
                        : btn.style === 'link'
                        ? 'w-full px-4 py-2 text-gray-500 hover:text-gray-700'
                        : 'w-full px-4 py-2 bg-gray-200 text-gray-900 rounded-lg'
                }, btn.text))
            )
        )
    );
}

export default PromoModalWidget;
$PATTERN$,
    'javascript',
    'react',
    '["widget", "modal", "popup", "coupon", "promotional"]'::jsonb,
    true
) ON CONFLICT DO NOTHING;

-- Pattern: Trigger Evaluation Controller
INSERT INTO ai_code_patterns (name, pattern_type, description, code, language, framework, tags, is_active) VALUES (
    'Trigger Evaluation Controller',
    'controller',
    'API endpoint that evaluates triggers against event context and returns matching actions',
    $PATTERN$
// controllers/evaluate.js
async function evaluate(req, res, { db, pluginData }) {
    try {
        const { eventType, context } = req.body;

        // Get triggers and actions from plugin_data
        const triggers = await pluginData.get('triggers') || [];
        const actions = await pluginData.get('actions') || [];
        const logs = await pluginData.get('logs') || [];

        // Find first matching trigger (by priority)
        const sortedTriggers = triggers
            .filter(t => t.is_enabled && t.event_type === eventType)
            .sort((a, b) => (a.priority || 100) - (b.priority || 100));

        let matchingTrigger = null;

        for (const trigger of sortedTriggers) {
            // Check conditions
            const conditionsMet = evaluateConditions(trigger.conditions || {}, context);
            if (!conditionsMet) continue;

            // Check frequency limits
            if (trigger.show_once_per_session && context.session_id) {
                const shown = logs.find(l => l.trigger_id === trigger.id && l.session_id === context.session_id);
                if (shown) continue;
            }

            matchingTrigger = trigger;
            break;
        }

        if (!matchingTrigger) {
            return res.json({ actions: [] });
        }

        // Get actions for this trigger
        const triggerActions = actions.filter(a => a.trigger_id === matchingTrigger.id && a.is_enabled);

        res.json({
            trigger: { id: matchingTrigger.id, name: matchingTrigger.name, slug: matchingTrigger.slug },
            actions: triggerActions
        });
    } catch (error) {
        console.error('Error evaluating triggers:', error);
        res.status(500).json({ error: 'Failed to evaluate' });
    }
}

function evaluateConditions(conditions, context) {
    for (const [field, rule] of Object.entries(conditions)) {
        const value = context[field];
        const { operator, value: expected } = rule;

        switch (operator) {
            case '==': if (value !== expected) return false; break;
            case '!=': if (value === expected) return false; break;
            case '>': if (value <= expected) return false; break;
            case '<': if (value >= expected) return false; break;
            case '>=': if (value < expected) return false; break;
            case '<=': if (value > expected) return false; break;
        }
    }
    return true;
}
$PATTERN$,
    'javascript',
    'express',
    '["controller", "api", "triggers", "evaluation", "conditions"]'::jsonb,
    true
) ON CONFLICT DO NOTHING;

-- =====================================================
-- 4. MORE CODE PATTERNS - ALL FILE TYPES
-- =====================================================

-- Pattern: Hook - Data Transformation (plugin_hooks)
INSERT INTO ai_code_patterns (name, pattern_type, description, code, language, framework, tags, is_active) VALUES (
    'Price Discount Hook',
    'hook',
    'Hook that transforms product price data - stored in plugin_hooks table',
    $PATTERN$
// hooks/product_price.js - Stored in plugin_hooks table
// hook_name: 'product.price', hook_type: 'filter', priority: 10
function applyEventDiscount(price, product, context) {
    // Check if there's an active coupon from event actions
    const appliedCoupon = window.__eventActionAppliedCoupon;

    if (!appliedCoupon) return price;

    if (appliedCoupon.discount_type === 'percentage') {
        return price * (1 - appliedCoupon.discount_value / 100);
    }

    if (appliedCoupon.discount_type === 'fixed') {
        return Math.max(0, price - appliedCoupon.discount_value);
    }

    return price;
}
$PATTERN$,
    'javascript',
    'react',
    '["hook", "filter", "price", "discount", "transformation"]'::jsonb,
    true
) ON CONFLICT DO NOTHING;

-- Pattern: Entity Definition (plugin_entities)
INSERT INTO ai_code_patterns (name, pattern_type, description, code, language, framework, tags, is_active) VALUES (
    'Database Entity Schema',
    'entity',
    'Entity definition for creating database tables - stored in plugin_entities table',
    $PATTERN$
// entities/EventLog.json - Stored in plugin_entities table
// This creates a database table for the plugin
{
    "entity_name": "EventLog",
    "table_name": "plugin_event_logs",
    "description": "Tracks all event action displays and conversions",
    "schema_definition": {
        "columns": [
            { "name": "id", "type": "UUID", "primaryKey": true, "default": "gen_random_uuid()" },
            { "name": "trigger_id", "type": "VARCHAR(100)", "nullable": false },
            { "name": "action_id", "type": "VARCHAR(100)", "nullable": true },
            { "name": "session_id", "type": "VARCHAR(255)", "nullable": true },
            { "name": "user_id", "type": "UUID", "nullable": true },
            { "name": "event_type", "type": "VARCHAR(100)", "nullable": false },
            { "name": "action_result", "type": "VARCHAR(50)", "nullable": true, "comment": "displayed, clicked, dismissed, converted" },
            { "name": "converted", "type": "BOOLEAN", "default": false },
            { "name": "conversion_value", "type": "DECIMAL(10,2)", "nullable": true },
            { "name": "page_url", "type": "TEXT", "nullable": true },
            { "name": "created_at", "type": "TIMESTAMP", "default": "NOW()" }
        ],
        "indexes": [
            { "name": "idx_event_logs_trigger", "columns": ["trigger_id"] },
            { "name": "idx_event_logs_session", "columns": ["session_id"] },
            { "name": "idx_event_logs_created", "columns": ["created_at"], "order": "DESC" }
        ]
    }
}
$PATTERN$,
    'json',
    'postgresql',
    '["entity", "database", "table", "schema", "migration"]'::jsonb,
    true
) ON CONFLICT DO NOTHING;

-- Pattern: Component (plugin_scripts - components folder)
INSERT INTO ai_code_patterns (name, pattern_type, description, code, language, framework, tags, is_active) VALUES (
    'React Component for Plugin',
    'component',
    'Reusable React component - stored in plugin_scripts with scope frontend',
    $PATTERN$
// components/CouponBadge.jsx - Stored in plugin_scripts
// file_name: 'components/CouponBadge.jsx', scope: 'frontend', script_type: 'js'

function CouponBadge({ code, discount, type }) {
    const [copied, setCopied] = React.useState(false);

    const copyCode = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const discountText = type === 'percentage' ? discount + '% OFF' : '$' + discount + ' OFF';

    return React.createElement('div', {
        className: 'inline-flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full cursor-pointer',
        onClick: copyCode
    },
        React.createElement('span', { className: 'font-mono font-bold' }, code),
        React.createElement('span', { className: 'text-sm' }, discountText),
        copied && React.createElement('span', { className: 'text-xs' }, 'Copied!')
    );
}

// Export for use in other plugin files
window.CouponBadge = CouponBadge;
$PATTERN$,
    'javascript',
    'react',
    '["component", "react", "ui", "badge", "coupon"]'::jsonb,
    true
) ON CONFLICT DO NOTHING;

-- Pattern: Utility Function (plugin_scripts - utils folder)
INSERT INTO ai_code_patterns (name, pattern_type, description, code, language, framework, tags, is_active) VALUES (
    'Utility Functions',
    'utility',
    'Helper utility functions - stored in plugin_scripts with scope frontend',
    $PATTERN$
// utils/eventHelpers.js - Stored in plugin_scripts
// file_name: 'utils/eventHelpers.js', scope: 'frontend', script_type: 'js'

// Session ID management
function getSessionId() {
    let sessionId = sessionStorage.getItem('event_session_id');
    if (!sessionId) {
        sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        sessionStorage.setItem('event_session_id', sessionId);
    }
    return sessionId;
}

// Visitor ID (persists across sessions)
function getVisitorId() {
    let visitorId = localStorage.getItem('event_visitor_id');
    if (!visitorId) {
        visitorId = 'visitor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('event_visitor_id', visitorId);
    }
    return visitorId;
}

// Condition evaluation helper
function evaluateCondition(operator, actual, expected) {
    switch (operator) {
        case '==': return actual === expected;
        case '!=': return actual !== expected;
        case '>': return actual > expected;
        case '<': return actual < expected;
        case '>=': return actual >= expected;
        case '<=': return actual <= expected;
        case 'contains': return String(actual).includes(expected);
        case 'in': return Array.isArray(expected) && expected.includes(actual);
        default: return true;
    }
}

// Export to window for plugin access
window.EventHelpers = { getSessionId, getVisitorId, evaluateCondition };
$PATTERN$,
    'javascript',
    'vanilla',
    '["utility", "helper", "session", "visitor", "conditions"]'::jsonb,
    true
) ON CONFLICT DO NOTHING;

-- Pattern: Service Class (plugin_scripts - services folder)
INSERT INTO ai_code_patterns (name, pattern_type, description, code, language, framework, tags, is_active) VALUES (
    'API Service Class',
    'service',
    'Service class for API calls - stored in plugin_scripts with scope frontend',
    $PATTERN$
// services/EventActionService.js - Stored in plugin_scripts
// file_name: 'services/EventActionService.js', scope: 'frontend', script_type: 'js'

class EventActionService {
    constructor(pluginSlug) {
        this.baseUrl = '/api/plugins/' + pluginSlug;
    }

    async evaluateTrigger(eventType, context) {
        const response = await fetch(this.baseUrl + '/evaluate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ eventType, context })
        });
        return response.json();
    }

    async logAction(triggerId, actionId, result) {
        return fetch(this.baseUrl + '/log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                trigger_id: triggerId,
                action_id: actionId,
                action_result: result,
                session_id: window.EventHelpers?.getSessionId(),
                page_url: window.location.href
            })
        });
    }

    async getTriggers() {
        const response = await fetch(this.baseUrl + '/triggers');
        return response.json();
    }

    async createTrigger(trigger) {
        const response = await fetch(this.baseUrl + '/triggers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ trigger })
        });
        return response.json();
    }
}

// Export for plugin use
window.EventActionService = EventActionService;
$PATTERN$,
    'javascript',
    'vanilla',
    '["service", "api", "class", "fetch", "crud"]'::jsonb,
    true
) ON CONFLICT DO NOTHING;

-- Pattern: Admin Page (plugin_admin_pages)
INSERT INTO ai_code_patterns (name, pattern_type, description, code, language, framework, tags, is_active) VALUES (
    'Admin Dashboard Page',
    'admin_page',
    'Admin panel page component - stored in plugin_admin_pages table',
    $PATTERN$
// admin/EventActionsDashboard.jsx - Stored in plugin_admin_pages
// page_name: 'Event Actions Dashboard', route: '/admin/plugins/event-actions'

function EventActionsDashboard({ pluginData, onSave }) {
    const [triggers, setTriggers] = React.useState([]);
    const [actions, setActions] = React.useState([]);
    const [stats, setStats] = React.useState({ displays: 0, clicks: 0, conversions: 0 });

    React.useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const triggersData = await pluginData.get('triggers') || [];
        const actionsData = await pluginData.get('actions') || [];
        const logs = await pluginData.get('logs') || [];

        setTriggers(triggersData);
        setActions(actionsData);
        setStats({
            displays: logs.filter(l => l.action_result === 'displayed').length,
            clicks: logs.filter(l => l.action_result === 'clicked').length,
            conversions: logs.filter(l => l.converted).length
        });
    };

    return React.createElement('div', { className: 'p-6' },
        // Header
        React.createElement('h1', { className: 'text-2xl font-bold mb-6' }, 'Event Actions'),

        // Stats cards
        React.createElement('div', { className: 'grid grid-cols-3 gap-4 mb-6' },
            React.createElement('div', { className: 'bg-blue-100 p-4 rounded-lg' },
                React.createElement('p', { className: 'text-3xl font-bold' }, stats.displays),
                React.createElement('p', { className: 'text-sm text-gray-600' }, 'Displays')
            ),
            React.createElement('div', { className: 'bg-green-100 p-4 rounded-lg' },
                React.createElement('p', { className: 'text-3xl font-bold' }, stats.clicks),
                React.createElement('p', { className: 'text-sm text-gray-600' }, 'Clicks')
            ),
            React.createElement('div', { className: 'bg-purple-100 p-4 rounded-lg' },
                React.createElement('p', { className: 'text-3xl font-bold' }, stats.conversions),
                React.createElement('p', { className: 'text-sm text-gray-600' }, 'Conversions')
            )
        ),

        // Triggers list
        React.createElement('h2', { className: 'text-xl font-semibold mb-4' }, 'Triggers'),
        React.createElement('div', { className: 'space-y-2' },
            triggers.map(t => React.createElement('div', {
                key: t.id,
                className: 'flex items-center justify-between p-3 bg-white rounded border'
            },
                React.createElement('span', null, t.name),
                React.createElement('span', {
                    className: t.is_enabled ? 'text-green-600' : 'text-gray-400'
                }, t.is_enabled ? 'Active' : 'Disabled')
            ))
        )
    );
}

export default EventActionsDashboard;
$PATTERN$,
    'javascript',
    'react',
    '["admin", "dashboard", "page", "stats", "management"]'::jsonb,
    true
) ON CONFLICT DO NOTHING;

-- Pattern: Migration SQL (plugin_migrations)
INSERT INTO ai_code_patterns (name, pattern_type, description, code, language, framework, tags, is_active) VALUES (
    'Database Migration',
    'migration',
    'SQL migration for creating plugin tables - stored in plugin_migrations table',
    $PATTERN$
-- migrations/20250101_create_event_logs.sql - Stored in plugin_migrations
-- Plugin: Event Actions
-- Version: 20250101_000000
-- Description: Create event_logs table for tracking displays and conversions

-- UP Migration
CREATE TABLE IF NOT EXISTS plugin_event_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plugin_id UUID NOT NULL,
    trigger_id VARCHAR(100) NOT NULL,
    action_id VARCHAR(100),
    session_id VARCHAR(255),
    user_id UUID,
    visitor_id VARCHAR(100),
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB DEFAULT '{}',
    action_result VARCHAR(50),
    converted BOOLEAN DEFAULT FALSE,
    conversion_value DECIMAL(10,2),
    conversion_at TIMESTAMP WITH TIME ZONE,
    page_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plugin_event_logs_trigger ON plugin_event_logs(trigger_id);
CREATE INDEX IF NOT EXISTS idx_plugin_event_logs_session ON plugin_event_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_plugin_event_logs_created ON plugin_event_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_plugin_event_logs_plugin ON plugin_event_logs(plugin_id);

-- DOWN Migration (Rollback)
-- DROP TABLE IF EXISTS plugin_event_logs CASCADE;
$PATTERN$,
    'sql',
    'postgresql',
    '["migration", "database", "table", "create", "indexes"]'::jsonb,
    true
) ON CONFLICT DO NOTHING;

-- Pattern: Cron Job Handler
INSERT INTO ai_code_patterns (name, pattern_type, description, code, language, framework, tags, is_active) VALUES (
    'Scheduled Cron Job',
    'cron',
    'Cron job handler for scheduled tasks - for future plugin_jobs table',
    $PATTERN$
// cron/cleanupOldLogs.js - Scheduled job
// schedule: '0 0 * * *' (daily at midnight)
// description: 'Clean up event logs older than 30 days'

async function cleanupOldLogs({ db, pluginData, pluginId }) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    try {
        // Clean up from plugin_data logs array
        const logs = await pluginData.get('logs') || [];
        const recentLogs = logs.filter(log =>
            new Date(log.created_at) > thirtyDaysAgo
        );

        const removedCount = logs.length - recentLogs.length;

        if (removedCount > 0) {
            await pluginData.set('logs', recentLogs);
            console.log('Cleaned up ' + removedCount + ' old event logs');
        }

        // If using database table
        if (db) {
            const result = await db.query(
                'DELETE FROM plugin_event_logs WHERE plugin_id = $1 AND created_at < $2',
                [pluginId, thirtyDaysAgo]
            );
            console.log('Deleted ' + result.rowCount + ' records from database');
        }

        return { success: true, removed: removedCount };
    } catch (error) {
        console.error('Cron job failed:', error);
        return { success: false, error: error.message };
    }
}

module.exports = { handler: cleanupOldLogs, schedule: '0 0 * * *' };
$PATTERN$,
    'javascript',
    'node',
    '["cron", "scheduled", "cleanup", "maintenance", "job"]'::jsonb,
    true
) ON CONFLICT DO NOTHING;

-- Pattern: README Documentation (plugin_docs)
INSERT INTO ai_code_patterns (name, pattern_type, description, code, language, framework, tags, is_active) VALUES (
    'Plugin README Documentation',
    'readme',
    'README.md documentation - stored in plugin_docs table with doc_type readme',
    $PATTERN$
# Event Actions Plugin

AI-driven promotional triggers that respond to storefront events.

## Features

- **DB-Driven Triggers**: Define when actions fire based on events and conditions
- **Multiple Actions**: Show modals, apply coupons, notifications, redirects
- **Session Tracking**: Control frequency per session/user
- **Conversion Tracking**: Monitor display, click, and conversion rates

## Event Types

| Event | Description |
|-------|-------------|
| `cart.view` | User views cart page |
| `cart.empty` | Cart has 0 items |
| `checkout.start` | Checkout begins |
| `exit.intent` | Mouse leaves viewport |
| `product.view` | Product page viewed |

## Configuration

Triggers and actions are stored in `plugin_data`:

```javascript
// Example trigger
{
    id: 'trigger_empty_cart',
    event_type: 'cart.view',
    conditions: { cart_items_count: { operator: '==', value: 0 } },
    show_once_per_session: true
}

// Example action
{
    trigger_id: 'trigger_empty_cart',
    action_type: 'show_modal',
    modal_config: { title: 'Your cart is empty!', ... }
}
```

## Admin Page

Navigate to `/admin/plugins/event-actions` to manage triggers and view stats.

## API Endpoints

- `GET /api/plugins/event-actions/triggers` - List triggers
- `POST /api/plugins/event-actions/triggers` - Create trigger
- `POST /api/plugins/event-actions/evaluate` - Evaluate event
- `POST /api/plugins/event-actions/log` - Log action result
$PATTERN$,
    'markdown',
    'docs',
    '["readme", "documentation", "docs", "guide", "help"]'::jsonb,
    true
) ON CONFLICT DO NOTHING;

-- =====================================================
-- 5. AI ENTITY DEFINITION for Event Actions
-- =====================================================
INSERT INTO ai_entity_definitions (
    entity_name, display_name, description, table_name, primary_key, tenant_column,
    supported_operations, fields, example_prompts,
    api_endpoint, requires_confirmation, is_destructive
) VALUES (
    'event_triggers',
    'Event Triggers',
    'Database-driven triggers that fire when storefront events occur (cart view, checkout start, exit intent). Configure conditions and targeting rules.',
    'plugin_data',
    'id',
    'plugin_id',
    '["list", "get", "create", "update", "delete"]'::jsonb,
    '{
        "id": {"type": "string", "description": "Unique trigger ID"},
        "name": {"type": "string", "description": "Display name"},
        "slug": {"type": "string", "description": "URL-safe identifier"},
        "event_type": {"type": "string", "description": "Event to listen for: cart.view, checkout.start, exit.intent, product.view"},
        "conditions": {"type": "object", "description": "JSON conditions like {cart_items_count: {operator: ==, value: 0}}"},
        "targeting": {"type": "object", "description": "User targeting rules"},
        "show_once_per_session": {"type": "boolean", "description": "Only show once per browser session"},
        "priority": {"type": "number", "description": "Lower number = higher priority"},
        "is_enabled": {"type": "boolean", "description": "Whether trigger is active"}
    }'::jsonb,
    '[
        "create a trigger to show modal when cart is empty",
        "add an exit intent popup trigger",
        "create trigger for checkout abandonment",
        "show offer when cart total is below $50",
        "trigger a 20% off coupon for first-time visitors"
    ]'::jsonb,
    '/api/plugins/event-actions/triggers',
    false,
    false
) ON CONFLICT (entity_name) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    example_prompts = EXCLUDED.example_prompts,
    fields = EXCLUDED.fields;

INSERT INTO ai_entity_definitions (
    entity_name, display_name, description, table_name, primary_key, tenant_column,
    supported_operations, fields, example_prompts,
    api_endpoint, requires_confirmation, is_destructive
) VALUES (
    'event_actions',
    'Event Actions',
    'Actions executed when triggers fire. Supports show_modal, apply_coupon, show_notification, and redirect action types.',
    'plugin_data',
    'id',
    'plugin_id',
    '["list", "get", "create", "update", "delete"]'::jsonb,
    '{
        "id": {"type": "string", "description": "Unique action ID"},
        "trigger_id": {"type": "string", "description": "ID of trigger this action belongs to"},
        "action_type": {"type": "string", "description": "Type: show_modal, apply_coupon, show_notification, redirect"},
        "modal_config": {"type": "object", "description": "Modal settings: title, message, buttons, style"},
        "coupon_config": {"type": "object", "description": "Coupon settings: code, discount_type, discount_value"},
        "is_enabled": {"type": "boolean", "description": "Whether action is active"}
    }'::jsonb,
    '[
        "add a modal action with 20% off coupon",
        "create action to show notification toast",
        "add redirect action to products page",
        "create modal with claim discount button"
    ]'::jsonb,
    '/api/plugins/event-actions/actions',
    false,
    false
) ON CONFLICT (entity_name) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    example_prompts = EXCLUDED.example_prompts,
    fields = EXCLUDED.fields;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Event Actions AI context seeded successfully!';
    RAISE NOTICE 'AI can now generate event-driven plugins with modals, coupons, and triggers.';
END $$;
