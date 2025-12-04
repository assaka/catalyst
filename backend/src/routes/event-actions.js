/**
 * AI Event Actions API Routes
 *
 * Database-driven event triggers and actions for plugins
 * Supports modals, coupons, notifications, redirects, and custom scripts
 */

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');

// Optional auth - allows unauthenticated requests but adds user if token exists
const optionalAuth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return next();

  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
  } catch (e) {
    // Invalid token, continue without user
  }
  next();
};
const ConnectionManager = require('../services/database/ConnectionManager');

// =====================================================
// ADMIN ROUTES - Manage Triggers & Actions
// =====================================================

/**
 * GET /api/event-actions/triggers
 * List all triggers for a store
 */
router.get('/triggers', authMiddleware, async (req, res) => {
    try {
        const { storeId } = req.query;
        if (!storeId) {
            return res.status(400).json({ error: 'storeId is required' });
        }

        const tenantDb = await ConnectionManager.getConnection(storeId);

        const triggers = await tenantDb('ai_event_triggers')
            .select('*')
            .orderBy('priority', 'asc')
            .orderBy('created_at', 'desc');

        // Get action counts for each trigger
        const triggerIds = triggers.map(t => t.id);
        const actionCounts = await tenantDb('ai_event_actions')
            .select('trigger_id')
            .count('* as count')
            .whereIn('trigger_id', triggerIds)
            .groupBy('trigger_id');

        const countMap = {};
        actionCounts.forEach(a => {
            countMap[a.trigger_id] = parseInt(a.count);
        });

        const result = triggers.map(t => ({
            ...t,
            action_count: countMap[t.id] || 0
        }));

        res.json({ triggers: result });
    } catch (error) {
        console.error('Error fetching triggers:', error);
        res.status(500).json({ error: 'Failed to fetch triggers' });
    }
});

/**
 * POST /api/event-actions/triggers
 * Create a new trigger
 */
router.post('/triggers', authMiddleware, async (req, res) => {
    try {
        const { storeId, trigger } = req.body;
        if (!storeId) {
            return res.status(400).json({ error: 'storeId is required' });
        }

        const tenantDb = await ConnectionManager.getConnection(storeId);

        const [newTrigger] = await tenantDb('ai_event_triggers')
            .insert({
                name: trigger.name,
                slug: trigger.slug || trigger.name.toLowerCase().replace(/\s+/g, '-'),
                description: trigger.description,
                event_type: trigger.event_type,
                conditions: JSON.stringify(trigger.conditions || {}),
                targeting: JSON.stringify(trigger.targeting || {}),
                show_once_per_session: trigger.show_once_per_session || false,
                show_once_per_user: trigger.show_once_per_user || false,
                max_displays_per_user: trigger.max_displays_per_user,
                cooldown_hours: trigger.cooldown_hours || 24,
                start_date: trigger.start_date,
                end_date: trigger.end_date,
                priority: trigger.priority || 100,
                is_enabled: trigger.is_enabled !== false,
                plugin_id: trigger.plugin_id,
                created_by: req.user?.id
            })
            .returning('*');

        res.json({ trigger: newTrigger });
    } catch (error) {
        console.error('Error creating trigger:', error);
        res.status(500).json({ error: 'Failed to create trigger' });
    }
});

/**
 * PUT /api/event-actions/triggers/:id
 * Update a trigger
 */
router.put('/triggers/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { storeId, trigger } = req.body;

        if (!storeId) {
            return res.status(400).json({ error: 'storeId is required' });
        }

        const tenantDb = await ConnectionManager.getConnection(storeId);

        const updateData = {};
        const allowedFields = [
            'name', 'slug', 'description', 'event_type', 'conditions', 'targeting',
            'show_once_per_session', 'show_once_per_user', 'max_displays_per_user',
            'cooldown_hours', 'start_date', 'end_date', 'priority', 'is_enabled', 'plugin_id'
        ];

        allowedFields.forEach(field => {
            if (trigger[field] !== undefined) {
                if (field === 'conditions' || field === 'targeting') {
                    updateData[field] = JSON.stringify(trigger[field]);
                } else {
                    updateData[field] = trigger[field];
                }
            }
        });

        const [updated] = await tenantDb('ai_event_triggers')
            .where('id', id)
            .update(updateData)
            .returning('*');

        res.json({ trigger: updated });
    } catch (error) {
        console.error('Error updating trigger:', error);
        res.status(500).json({ error: 'Failed to update trigger' });
    }
});

/**
 * DELETE /api/event-actions/triggers/:id
 * Delete a trigger and its actions
 */
router.delete('/triggers/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { storeId } = req.query;

        if (!storeId) {
            return res.status(400).json({ error: 'storeId is required' });
        }

        const tenantDb = await ConnectionManager.getConnection(storeId);

        await tenantDb('ai_event_triggers')
            .where('id', id)
            .delete();

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting trigger:', error);
        res.status(500).json({ error: 'Failed to delete trigger' });
    }
});

/**
 * GET /api/event-actions/triggers/:id/actions
 * Get all actions for a trigger
 */
router.get('/triggers/:id/actions', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { storeId } = req.query;

        if (!storeId) {
            return res.status(400).json({ error: 'storeId is required' });
        }

        const tenantDb = await ConnectionManager.getConnection(storeId);

        const actions = await tenantDb('ai_event_actions')
            .where('trigger_id', id)
            .orderBy('action_order', 'asc');

        res.json({ actions });
    } catch (error) {
        console.error('Error fetching actions:', error);
        res.status(500).json({ error: 'Failed to fetch actions' });
    }
});

/**
 * POST /api/event-actions/actions
 * Create a new action
 */
router.post('/actions', authMiddleware, async (req, res) => {
    try {
        const { storeId, action } = req.body;

        if (!storeId) {
            return res.status(400).json({ error: 'storeId is required' });
        }

        const tenantDb = await ConnectionManager.getConnection(storeId);

        const [newAction] = await tenantDb('ai_event_actions')
            .insert({
                trigger_id: action.trigger_id,
                action_type: action.action_type,
                action_order: action.action_order || 0,
                modal_config: JSON.stringify(action.modal_config || {}),
                coupon_config: JSON.stringify(action.coupon_config || {}),
                notification_config: JSON.stringify(action.notification_config || {}),
                redirect_config: JSON.stringify(action.redirect_config || {}),
                script_code: action.script_code,
                is_enabled: action.is_enabled !== false
            })
            .returning('*');

        res.json({ action: newAction });
    } catch (error) {
        console.error('Error creating action:', error);
        res.status(500).json({ error: 'Failed to create action' });
    }
});

/**
 * PUT /api/event-actions/actions/:id
 * Update an action
 */
router.put('/actions/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { storeId, action } = req.body;

        if (!storeId) {
            return res.status(400).json({ error: 'storeId is required' });
        }

        const tenantDb = await ConnectionManager.getConnection(storeId);

        const updateData = {};
        const jsonFields = ['modal_config', 'coupon_config', 'notification_config', 'redirect_config'];
        const allowedFields = [...jsonFields, 'action_type', 'action_order', 'script_code', 'is_enabled'];

        allowedFields.forEach(field => {
            if (action[field] !== undefined) {
                if (jsonFields.includes(field)) {
                    updateData[field] = JSON.stringify(action[field]);
                } else {
                    updateData[field] = action[field];
                }
            }
        });

        const [updated] = await tenantDb('ai_event_actions')
            .where('id', id)
            .update(updateData)
            .returning('*');

        res.json({ action: updated });
    } catch (error) {
        console.error('Error updating action:', error);
        res.status(500).json({ error: 'Failed to update action' });
    }
});

/**
 * DELETE /api/event-actions/actions/:id
 * Delete an action
 */
router.delete('/actions/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { storeId } = req.query;

        if (!storeId) {
            return res.status(400).json({ error: 'storeId is required' });
        }

        const tenantDb = await ConnectionManager.getConnection(storeId);

        await tenantDb('ai_event_actions')
            .where('id', id)
            .delete();

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting action:', error);
        res.status(500).json({ error: 'Failed to delete action' });
    }
});

// =====================================================
// STOREFRONT ROUTES - Evaluate & Log Events
// =====================================================

/**
 * POST /api/event-actions/evaluate
 * Evaluate triggers for a given event (called from storefront)
 * Returns matching actions to execute
 */
router.post('/evaluate', optionalAuth, async (req, res) => {
    try {
        const { storeId, eventType, context } = req.body;

        if (!storeId || !eventType) {
            return res.status(400).json({ error: 'storeId and eventType are required' });
        }

        const tenantDb = await ConnectionManager.getConnection(storeId);
        const now = new Date();

        // Fetch enabled triggers for this event type
        let query = tenantDb('ai_event_triggers')
            .where('event_type', eventType)
            .where('is_enabled', true)
            .where(function() {
                this.whereNull('start_date').orWhere('start_date', '<=', now);
            })
            .where(function() {
                this.whereNull('end_date').orWhere('end_date', '>=', now);
            })
            .orderBy('priority', 'asc');

        const triggers = await query;

        if (triggers.length === 0) {
            return res.json({ actions: [] });
        }

        // Evaluate conditions for each trigger
        const matchingTriggers = [];

        for (const trigger of triggers) {
            const conditions = trigger.conditions || {};
            const targeting = trigger.targeting || {};

            // Check if all conditions are met
            const conditionsMet = evaluateConditions(conditions, context);
            const targetingMet = evaluateTargeting(targeting, context);

            if (conditionsMet && targetingMet) {
                // Check frequency limits
                const canShow = await checkFrequencyLimits(tenantDb, trigger, context);

                if (canShow) {
                    matchingTriggers.push(trigger);
                    // Only return first matching trigger (highest priority)
                    break;
                }
            }
        }

        if (matchingTriggers.length === 0) {
            return res.json({ actions: [] });
        }

        // Get actions for matching trigger
        const trigger = matchingTriggers[0];
        const actions = await tenantDb('ai_event_actions')
            .where('trigger_id', trigger.id)
            .where('is_enabled', true)
            .orderBy('action_order', 'asc');

        // Process coupon creation if needed
        for (const action of actions) {
            if (action.action_type === 'show_modal' || action.action_type === 'apply_coupon') {
                const couponConfig = action.coupon_config || {};
                if (couponConfig.create_if_not_exists && couponConfig.code) {
                    await ensureCouponExists(tenantDb, couponConfig);
                }
            }
        }

        res.json({
            trigger: {
                id: trigger.id,
                name: trigger.name,
                slug: trigger.slug
            },
            actions: actions.map(a => ({
                id: a.id,
                action_type: a.action_type,
                modal_config: a.modal_config,
                coupon_config: a.coupon_config,
                notification_config: a.notification_config,
                redirect_config: a.redirect_config,
                script_code: a.script_code
            }))
        });
    } catch (error) {
        console.error('Error evaluating event:', error);
        res.status(500).json({ error: 'Failed to evaluate event' });
    }
});

/**
 * POST /api/event-actions/log
 * Log an action display or interaction
 */
router.post('/log', optionalAuth, async (req, res) => {
    try {
        const { storeId, triggerId, actionId, sessionId, visitorId, eventType, eventData, actionType, actionResult, pageUrl } = req.body;

        if (!storeId) {
            return res.status(400).json({ error: 'storeId is required' });
        }

        const tenantDb = await ConnectionManager.getConnection(storeId);

        await tenantDb('ai_event_action_logs').insert({
            trigger_id: triggerId,
            action_id: actionId,
            session_id: sessionId,
            user_id: req.user?.id,
            visitor_id: visitorId,
            event_type: eventType,
            event_data: JSON.stringify(eventData || {}),
            action_type: actionType,
            action_result: actionResult,
            page_url: pageUrl,
            ip_address: req.ip
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error logging action:', error);
        res.status(500).json({ error: 'Failed to log action' });
    }
});

/**
 * POST /api/event-actions/convert
 * Mark an action as converted (e.g., coupon used, purchase made)
 */
router.post('/convert', optionalAuth, async (req, res) => {
    try {
        const { storeId, triggerId, sessionId, visitorId, conversionValue } = req.body;

        if (!storeId) {
            return res.status(400).json({ error: 'storeId is required' });
        }

        const tenantDb = await ConnectionManager.getConnection(storeId);

        // Find the most recent log for this session/trigger
        const log = await tenantDb('ai_event_action_logs')
            .where('trigger_id', triggerId)
            .where(function() {
                if (sessionId) this.where('session_id', sessionId);
                if (visitorId) this.orWhere('visitor_id', visitorId);
            })
            .orderBy('created_at', 'desc')
            .first();

        if (log) {
            await tenantDb('ai_event_action_logs')
                .where('id', log.id)
                .update({
                    converted: true,
                    conversion_value: conversionValue,
                    conversion_at: new Date()
                });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error marking conversion:', error);
        res.status(500).json({ error: 'Failed to mark conversion' });
    }
});

/**
 * GET /api/event-actions/stats
 * Get statistics for triggers
 */
router.get('/stats', authMiddleware, async (req, res) => {
    try {
        const { storeId, triggerId, days = 30 } = req.query;

        if (!storeId) {
            return res.status(400).json({ error: 'storeId is required' });
        }

        const tenantDb = await ConnectionManager.getConnection(storeId);
        const since = new Date();
        since.setDate(since.getDate() - parseInt(days));

        let query = tenantDb('ai_event_action_logs')
            .where('created_at', '>=', since);

        if (triggerId) {
            query = query.where('trigger_id', triggerId);
        }

        const stats = await query
            .select('trigger_id')
            .count('* as total_displays')
            .sum(tenantDb.raw('CASE WHEN action_result = \'clicked\' THEN 1 ELSE 0 END as clicks'))
            .sum(tenantDb.raw('CASE WHEN action_result = \'dismissed\' THEN 1 ELSE 0 END as dismissals'))
            .sum(tenantDb.raw('CASE WHEN converted = true THEN 1 ELSE 0 END as conversions'))
            .sum('conversion_value as total_revenue')
            .groupBy('trigger_id');

        res.json({ stats });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Evaluate conditions against context
 */
function evaluateConditions(conditions, context) {
    if (!conditions || Object.keys(conditions).length === 0) {
        return true;
    }

    for (const [field, rule] of Object.entries(conditions)) {
        const contextValue = getNestedValue(context, field);
        const { operator, value } = rule;

        let result = false;
        switch (operator) {
            case '==':
            case '===':
                result = contextValue === value;
                break;
            case '!=':
            case '!==':
                result = contextValue !== value;
                break;
            case '>':
                result = contextValue > value;
                break;
            case '>=':
                result = contextValue >= value;
                break;
            case '<':
                result = contextValue < value;
                break;
            case '<=':
                result = contextValue <= value;
                break;
            case 'contains':
                result = Array.isArray(contextValue)
                    ? contextValue.includes(value)
                    : String(contextValue).includes(value);
                break;
            case 'not_contains':
                result = Array.isArray(contextValue)
                    ? !contextValue.includes(value)
                    : !String(contextValue).includes(value);
                break;
            case 'in':
                result = Array.isArray(value) && value.includes(contextValue);
                break;
            case 'not_in':
                result = Array.isArray(value) && !value.includes(contextValue);
                break;
            case 'exists':
                result = contextValue !== undefined && contextValue !== null;
                break;
            case 'not_exists':
                result = contextValue === undefined || contextValue === null;
                break;
            default:
                result = true;
        }

        if (!result) {
            return false;
        }
    }

    return true;
}

/**
 * Evaluate targeting rules
 */
function evaluateTargeting(targeting, context) {
    if (!targeting || Object.keys(targeting).length === 0) {
        return true;
    }

    // User type targeting
    if (targeting.user_type) {
        const isGuest = !context.user || !context.user.id;
        if (targeting.user_type === 'guest' && !isGuest) return false;
        if (targeting.user_type === 'logged_in' && isGuest) return false;
    }

    // First purchase targeting
    if (targeting.first_purchase === true && context.user?.order_count > 0) {
        return false;
    }

    // Exclude already converted
    if (targeting.exclude_converted && context.hasConverted) {
        return false;
    }

    // Page targeting
    if (targeting.pages && Array.isArray(targeting.pages)) {
        if (!targeting.pages.includes(context.currentPage)) {
            return false;
        }
    }

    // Device targeting
    if (targeting.device && context.device) {
        if (targeting.device !== context.device) {
            return false;
        }
    }

    return true;
}

/**
 * Check frequency limits
 */
async function checkFrequencyLimits(db, trigger, context) {
    const { session_id, visitor_id, user_id } = context;

    // Check session limit
    if (trigger.show_once_per_session && session_id) {
        const sessionLog = await db('ai_event_action_logs')
            .where('trigger_id', trigger.id)
            .where('session_id', session_id)
            .first();

        if (sessionLog) return false;
    }

    // Check user/visitor limit
    if (trigger.show_once_per_user) {
        let query = db('ai_event_action_logs').where('trigger_id', trigger.id);

        if (user_id) {
            query = query.where('user_id', user_id);
        } else if (visitor_id) {
            query = query.where('visitor_id', visitor_id);
        }

        const userLog = await query.first();
        if (userLog) return false;
    }

    // Check max displays
    if (trigger.max_displays_per_user) {
        let query = db('ai_event_action_logs')
            .where('trigger_id', trigger.id)
            .count('* as count');

        if (user_id) {
            query = query.where('user_id', user_id);
        } else if (visitor_id) {
            query = query.where('visitor_id', visitor_id);
        }

        const [{ count }] = await query;
        if (parseInt(count) >= trigger.max_displays_per_user) return false;
    }

    // Check cooldown
    if (trigger.cooldown_hours) {
        const cooldownTime = new Date();
        cooldownTime.setHours(cooldownTime.getHours() - trigger.cooldown_hours);

        let query = db('ai_event_action_logs')
            .where('trigger_id', trigger.id)
            .where('created_at', '>=', cooldownTime);

        if (user_id) {
            query = query.where('user_id', user_id);
        } else if (visitor_id) {
            query = query.where('visitor_id', visitor_id);
        }

        const recentLog = await query.first();
        if (recentLog) return false;
    }

    return true;
}

/**
 * Ensure coupon exists in database
 */
async function ensureCouponExists(db, couponConfig) {
    const { code, discount_type, discount_value, coupon_settings = {} } = couponConfig;

    // Check if coupon exists
    const existing = await db('coupons').where('code', code).first();
    if (existing) return existing;

    // Create coupon
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (coupon_settings.expires_days || 30));

    try {
        const [coupon] = await db('coupons')
            .insert({
                code,
                discount_type,
                discount_value,
                min_order_amount: coupon_settings.min_order_amount || 0,
                max_uses: coupon_settings.max_uses || null,
                max_uses_per_user: coupon_settings.max_uses_per_user || 1,
                expires_at: expiresAt,
                is_active: true
            })
            .returning('*');

        return coupon;
    } catch (error) {
        console.error('Error creating coupon:', error);
        return null;
    }
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
        return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
}

module.exports = router;
