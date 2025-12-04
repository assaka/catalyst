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
-- 4. AI ENTITY DEFINITION for Event Actions
-- =====================================================
INSERT INTO ai_entity_definitions (
    entity_name, table_name, primary_key, tenant_column,
    supported_operations, fields, example_prompts,
    api_endpoint, requires_confirmation, is_destructive
) VALUES (
    'event_triggers',
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
    example_prompts = EXCLUDED.example_prompts,
    fields = EXCLUDED.fields;

INSERT INTO ai_entity_definitions (
    entity_name, table_name, primary_key, tenant_column,
    supported_operations, fields, example_prompts,
    api_endpoint, requires_confirmation, is_destructive
) VALUES (
    'event_actions',
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
    example_prompts = EXCLUDED.example_prompts,
    fields = EXCLUDED.fields;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Event Actions AI context seeded successfully!';
    RAISE NOTICE 'AI can now generate event-driven plugins with modals, coupons, and triggers.';
END $$;
