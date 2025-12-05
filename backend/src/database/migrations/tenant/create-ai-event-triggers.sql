-- AI Event Triggers & Actions for Tenant DB
-- Database-driven event triggers for plugins, modals, coupons, notifications

-- =====================================================
-- AI Event Triggers (when to fire actions)
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_event_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT,
  event_type VARCHAR(100) NOT NULL, -- page_view, add_to_cart, checkout_start, exit_intent, scroll_depth, time_on_page
  conditions JSONB DEFAULT '{}', -- e.g., {"cart_total": {">": 50}, "product_category": "electronics"}
  targeting JSONB DEFAULT '{}', -- e.g., {"returning_visitor": true, "device": "mobile"}
  show_once_per_session BOOLEAN DEFAULT false,
  show_once_per_user BOOLEAN DEFAULT false,
  max_displays_per_user INTEGER,
  cooldown_hours INTEGER DEFAULT 24,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  priority INTEGER DEFAULT 100, -- Lower = higher priority
  is_enabled BOOLEAN DEFAULT true,
  plugin_id UUID, -- Optional link to a plugin
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_ai_event_triggers_event_type ON ai_event_triggers(event_type, is_enabled);
CREATE INDEX IF NOT EXISTS idx_ai_event_triggers_priority ON ai_event_triggers(priority, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_event_triggers_plugin ON ai_event_triggers(plugin_id);

-- =====================================================
-- AI Event Actions (what to do when triggered)
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_event_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_id UUID NOT NULL REFERENCES ai_event_triggers(id) ON DELETE CASCADE,
  action_type VARCHAR(50) NOT NULL, -- modal, coupon, notification, redirect, script
  action_order INTEGER DEFAULT 0, -- Order of execution
  modal_config JSONB DEFAULT '{}', -- Modal settings (title, content, button, etc.)
  coupon_config JSONB DEFAULT '{}', -- Coupon settings (code, discount, expiry)
  notification_config JSONB DEFAULT '{}', -- Toast/notification settings
  redirect_config JSONB DEFAULT '{}', -- Redirect URL and delay
  script_code TEXT, -- Custom JavaScript to execute
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_event_actions_trigger ON ai_event_actions(trigger_id, action_order);
CREATE INDEX IF NOT EXISTS idx_ai_event_actions_type ON ai_event_actions(action_type);

-- =====================================================
-- AI Event Logs (track trigger displays and interactions)
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_event_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_id UUID REFERENCES ai_event_triggers(id) ON DELETE SET NULL,
  action_id UUID REFERENCES ai_event_actions(id) ON DELETE SET NULL,
  user_id UUID,
  visitor_id VARCHAR(255), -- Anonymous visitor tracking
  session_id VARCHAR(255),
  event_type VARCHAR(100),
  event_data JSONB DEFAULT '{}', -- Context when trigger fired
  action_taken VARCHAR(50), -- displayed, clicked, dismissed, converted
  conversion_value DECIMAL(10,2), -- If action led to purchase
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for analytics
CREATE INDEX IF NOT EXISTS idx_ai_event_logs_trigger ON ai_event_logs(trigger_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_event_logs_user ON ai_event_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_event_logs_visitor ON ai_event_logs(visitor_id, session_id);
CREATE INDEX IF NOT EXISTS idx_ai_event_logs_action ON ai_event_logs(action_taken, created_at DESC);

-- =====================================================
-- RLS Policies (for Supabase auth)
-- =====================================================
ALTER TABLE ai_event_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_event_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_event_logs ENABLE ROW LEVEL SECURITY;

-- Triggers: admin can manage, public can read enabled
DROP POLICY IF EXISTS "Admins can manage triggers" ON ai_event_triggers;
CREATE POLICY "Admins can manage triggers" ON ai_event_triggers
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public can read enabled triggers" ON ai_event_triggers;
CREATE POLICY "Public can read enabled triggers" ON ai_event_triggers
  FOR SELECT USING (is_enabled = true);

-- Actions: admin can manage, public can read
DROP POLICY IF EXISTS "Admins can manage actions" ON ai_event_actions;
CREATE POLICY "Admins can manage actions" ON ai_event_actions
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public can read actions" ON ai_event_actions;
CREATE POLICY "Public can read actions" ON ai_event_actions
  FOR SELECT USING (is_enabled = true);

-- Logs: anyone can insert, admins can read all
DROP POLICY IF EXISTS "Anyone can insert logs" ON ai_event_logs;
CREATE POLICY "Anyone can insert logs" ON ai_event_logs
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can read all logs" ON ai_event_logs;
CREATE POLICY "Admins can read all logs" ON ai_event_logs
  FOR SELECT USING (true);
