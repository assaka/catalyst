-- AI Event Actions System
-- 100% Database-driven event triggers and actions for plugins
-- Allows AI to create dynamic behaviors like modals, coupons, notifications

-- =====================================================
-- EVENT TRIGGERS
-- Defines when an action should fire
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_event_triggers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Plugin association (optional - can be standalone)
    plugin_id UUID REFERENCES plugins(id) ON DELETE CASCADE,

    -- Trigger identification
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,

    -- Event type that activates this trigger
    -- Examples: cart.view, cart.empty, checkout.start, product.view,
    --           order.complete, user.login, page.view
    event_type VARCHAR(100) NOT NULL,

    -- Conditions that must be met (JSONB for flexibility)
    -- Example: {"cart_total": {"operator": "<", "value": 50}, "cart_items_count": {"operator": "==", "value": 0}}
    conditions JSONB DEFAULT '{}',

    -- Targeting rules
    -- Example: {"user_type": "guest", "first_purchase": true, "visited_pages": ["cart"]}
    targeting JSONB DEFAULT '{}',

    -- Frequency controls
    show_once_per_session BOOLEAN DEFAULT FALSE,
    show_once_per_user BOOLEAN DEFAULT FALSE,
    max_displays_per_user INTEGER DEFAULT NULL,
    cooldown_hours INTEGER DEFAULT 24, -- Hours before showing again to same user

    -- Scheduling
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,

    -- Priority (lower = higher priority, checked first)
    priority INTEGER DEFAULT 100,

    -- Status
    is_enabled BOOLEAN DEFAULT TRUE,

    -- Metadata
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT unique_trigger_slug UNIQUE (slug)
);

-- =====================================================
-- EVENT ACTIONS
-- Defines what happens when a trigger fires
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_event_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Link to trigger
    trigger_id UUID NOT NULL REFERENCES ai_event_triggers(id) ON DELETE CASCADE,

    -- Action type
    -- Examples: show_modal, apply_coupon, show_notification, redirect, track_event, run_script
    action_type VARCHAR(50) NOT NULL,

    -- Action order (multiple actions per trigger)
    action_order INTEGER DEFAULT 0,

    -- =====================================================
    -- MODAL CONFIGURATION (when action_type = 'show_modal')
    -- =====================================================
    modal_config JSONB DEFAULT '{}'::jsonb,
    -- Example modal_config:
    -- {
    --   "title": "Your cart is empty!",
    --   "message": "Here's 20% off to get you started",
    --   "image_url": "/images/promo.jpg",
    --   "style": {
    --     "position": "center", -- center, bottom-right, top-bar
    --     "size": "medium", -- small, medium, large, fullscreen
    --     "theme": "light", -- light, dark, custom
    --     "backdrop": true,
    --     "animation": "fade" -- fade, slide, zoom
    --   },
    --   "buttons": [
    --     {"text": "Claim Discount", "action": "apply_coupon", "style": "primary"},
    --     {"text": "No thanks", "action": "dismiss", "style": "secondary"}
    --   ],
    --   "close_on_backdrop": true,
    --   "auto_dismiss_seconds": null
    -- }

    -- =====================================================
    -- COUPON CONFIGURATION (when action_type = 'apply_coupon')
    -- =====================================================
    coupon_config JSONB DEFAULT '{}'::jsonb,
    -- Example coupon_config:
    -- {
    --   "code": "EMPTYCART20",
    --   "discount_type": "percentage", -- percentage, fixed, free_shipping
    --   "discount_value": 20,
    --   "auto_apply": true,
    --   "show_in_modal": true,
    --   "create_if_not_exists": true,
    --   "coupon_settings": {
    --     "min_order_amount": 0,
    --     "max_uses": 1000,
    --     "max_uses_per_user": 1,
    --     "expires_days": 7
    --   }
    -- }

    -- =====================================================
    -- NOTIFICATION CONFIGURATION (when action_type = 'show_notification')
    -- =====================================================
    notification_config JSONB DEFAULT '{}'::jsonb,
    -- Example:
    -- {
    --   "type": "toast", -- toast, banner, badge
    --   "message": "You've unlocked free shipping!",
    --   "duration": 5000,
    --   "position": "top-right"
    -- }

    -- =====================================================
    -- REDIRECT CONFIGURATION (when action_type = 'redirect')
    -- =====================================================
    redirect_config JSONB DEFAULT '{}'::jsonb,
    -- Example:
    -- {
    --   "url": "/products/sale",
    --   "delay_ms": 0,
    --   "new_tab": false
    -- }

    -- =====================================================
    -- CUSTOM SCRIPT (when action_type = 'run_script')
    -- =====================================================
    script_code TEXT,
    -- JavaScript code to execute (sandboxed)

    -- Status
    is_enabled BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- EVENT ACTION LOGS
-- Track when actions are shown/triggered
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_event_action_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    trigger_id UUID REFERENCES ai_event_triggers(id) ON DELETE SET NULL,
    action_id UUID REFERENCES ai_event_actions(id) ON DELETE SET NULL,

    -- Context
    session_id VARCHAR(100),
    user_id UUID,
    visitor_id VARCHAR(100), -- For anonymous users

    -- Event details
    event_type VARCHAR(100),
    event_data JSONB DEFAULT '{}',

    -- Result
    action_type VARCHAR(50),
    action_result VARCHAR(50), -- displayed, clicked, dismissed, converted

    -- Conversion tracking
    converted BOOLEAN DEFAULT FALSE,
    conversion_value DECIMAL(10,2),
    conversion_at TIMESTAMP WITH TIME ZONE,

    -- Metadata
    page_url TEXT,
    user_agent TEXT,
    ip_address INET,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_triggers_event_type ON ai_event_triggers(event_type);
CREATE INDEX IF NOT EXISTS idx_triggers_enabled ON ai_event_triggers(is_enabled) WHERE is_enabled = TRUE;
CREATE INDEX IF NOT EXISTS idx_triggers_plugin ON ai_event_triggers(plugin_id);
CREATE INDEX IF NOT EXISTS idx_triggers_priority ON ai_event_triggers(priority);
CREATE INDEX IF NOT EXISTS idx_triggers_dates ON ai_event_triggers(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_actions_trigger ON ai_event_actions(trigger_id);
CREATE INDEX IF NOT EXISTS idx_actions_type ON ai_event_actions(action_type);

CREATE INDEX IF NOT EXISTS idx_logs_trigger ON ai_event_action_logs(trigger_id);
CREATE INDEX IF NOT EXISTS idx_logs_session ON ai_event_action_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_logs_user ON ai_event_action_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_created ON ai_event_action_logs(created_at);

-- =====================================================
-- TRIGGERS FOR updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_ai_event_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_ai_event_triggers_updated ON ai_event_triggers;
CREATE TRIGGER trigger_ai_event_triggers_updated
    BEFORE UPDATE ON ai_event_triggers
    FOR EACH ROW EXECUTE FUNCTION update_ai_event_timestamp();

DROP TRIGGER IF EXISTS trigger_ai_event_actions_updated ON ai_event_actions;
CREATE TRIGGER trigger_ai_event_actions_updated
    BEFORE UPDATE ON ai_event_actions
    FOR EACH ROW EXECUTE FUNCTION update_ai_event_timestamp();

-- =====================================================
-- SAMPLE DATA: Empty Cart Modal with 20% Coupon
-- =====================================================
-- Uncomment to insert example:

-- INSERT INTO ai_event_triggers (name, slug, event_type, conditions, targeting, show_once_per_session, priority)
-- VALUES (
--     'Empty Cart Offer',
--     'empty-cart-20-off',
--     'cart.view',
--     '{"cart_items_count": {"operator": "==", "value": 0}}'::jsonb,
--     '{"exclude_converted": true}'::jsonb,
--     true,
--     10
-- );

-- INSERT INTO ai_event_actions (trigger_id, action_type, modal_config, coupon_config)
-- SELECT
--     id,
--     'show_modal',
--     '{
--         "title": "Your cart is feeling lonely!",
--         "message": "Looks like your cart is empty. Here''s 20% off your first purchase to help you get started!",
--         "image_url": "/images/empty-cart-promo.svg",
--         "style": {
--             "position": "center",
--             "size": "medium",
--             "theme": "light",
--             "backdrop": true,
--             "animation": "zoom"
--         },
--         "buttons": [
--             {"text": "Claim 20% Off", "action": "apply_coupon", "style": "primary", "coupon_code": "EMPTYCART20"},
--             {"text": "Browse Products", "action": "redirect", "url": "/products", "style": "secondary"},
--             {"text": "No thanks", "action": "dismiss", "style": "link"}
--         ]
--     }'::jsonb,
--     '{
--         "code": "EMPTYCART20",
--         "discount_type": "percentage",
--         "discount_value": 20,
--         "auto_apply": false,
--         "create_if_not_exists": true,
--         "coupon_settings": {
--             "min_order_amount": 0,
--             "max_uses_per_user": 1,
--             "expires_days": 7
--         }
--     }'::jsonb
-- FROM ai_event_triggers WHERE slug = 'empty-cart-20-off';
