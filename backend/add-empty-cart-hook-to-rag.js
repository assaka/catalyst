// Add empty cart hook troubleshooting guide to RAG system
require('dotenv').config();
const { sequelize } = require('./src/database/connection');

async function addToRAG() {
  try {
    console.log('📚 Adding empty cart hook guide to RAG system...\n');

    const document = {
      title: 'Empty Cart Hook Issue - Troubleshooting Guide',
      type: 'troubleshooting',
      category: 'plugins',
      mode: 'developer',
      priority: 85,
      content: `# Empty Cart Hook Issue - Root Cause & Solution

## Core Issue

**Problem:** Hook registered successfully but never executed for empty carts.

**Root Cause:** Cart.jsx had an early return for empty carts that skipped calling hookSystem.apply().

## The Bug

\`\`\`javascript
// BROKEN CODE (Before Fix)
const cartItems = await cartService.getCart();

if (cartItems.length === 0) {
    setCartItems([]);
    return;  // ← EARLY RETURN - HOOK NEVER CALLED!
}

// This code was NEVER reached for empty carts:
const processedItems = hookSystem.apply('cart.processLoadedItems', cartItems, context);
\`\`\`

**Why this breaks empty cart hooks:**
- Hook logic checks \`items.length === 0\` to show coupon modal
- But hook is NEVER called when cart is empty
- Early return skips the hookSystem.apply() call entirely

## The Fix

**File:** src/pages/storefront/Cart.jsx:362-378

\`\`\`javascript
// FIXED CODE (After Fix)
const cartItems = await cartService.getCart();

if (cartItems.length === 0) {
    console.log('Cart is empty - calling hook with empty array');

    // ✅ CALL HOOK FIRST with empty array
    const processedEmptyCart = hookSystem.apply('cart.processLoadedItems', [], context);

    setCartItems([]);
    return;
}

// For non-empty carts, continue as before
const processedItems = hookSystem.apply('cart.processLoadedItems', cartItems, context);
\`\`\`

## Best Practice: Always Call Hooks

**Rule:** Call hooks for ALL scenarios, not just when conditions are met.

\`\`\`javascript
// ❌ BAD - Hook skipped for empty state
if (items.length === 0) return;
hookSystem.apply('processItems', items);

// ✅ GOOD - Hook always called
const processed = hookSystem.apply('processItems', items);
if (processed.length === 0) return;
\`\`\`

**Why?** The hook itself should decide what to do based on the data, not the caller.

## Secondary Issue: Error Handling

**Problem:** One broken hook prevented ALL hooks from loading.

**Solution:** Wrap each hook registration in try-catch (App.jsx:97-129)

\`\`\`javascript
// ✅ RESILIENT LOADING
for (const hook of plugin.hooks) {
    try {
        const fn = createHandlerFromDatabaseCode(hook.handler_code);
        hookSystem.register(hook.hook_name, fn);
        console.log('✅ Registered hook:', hook.hook_name);
    } catch (error) {
        console.error('❌ Failed to register hook:', hook.hook_name, error);
        // Continue with next hook - don't stop entire loop
    }
}
\`\`\`

## Debugging Pattern

**Use step-by-step logging to identify where execution stops:**

\`\`\`javascript
console.log('Step 1: Starting...');
const data = await fetchData();

console.log('Step 2: Processing...');
const processed = processData(data);

console.log('Step 3: Calling hook...');
const result = hookSystem.apply('myHook', processed);

console.log('Step 4: Done');
\`\`\`

**If you see Step 1-2 but not Step 3:** Execution stopped between Step 2 and Step 3.

## Testing Empty Cart Hooks

1. Visit /cart with 0 items
2. Open DevTools Console
3. Clear session: \`sessionStorage.clear()\`
4. Refresh page

**Expected logs:**
\`\`\`
✅ Registered hook: cart.processLoadedItems
🛒 [Cart] Cart is empty - calling hook with empty array
🎁 [Empty Cart Hook] Triggered!
🎁 [Empty Cart Hook] Creating modal...
\`\`\`

## Related Issues

- Hooks vs Events: Hooks modify/filter values, events just notify
- Plugin IDs must be UUIDs, not slugs
- Broken plugin code needs isolation (try-catch)
- Extensions failing can block initialization

## Files Modified

- src/pages/storefront/Cart.jsx:362-378 (call hook for empty cart)
- src/App.jsx:97-129 (error handling for hooks/events)
- src/App.jsx:284-296 (disable broken analytics-tracker)

## Keywords

hook not firing, hook not executing, empty cart hook, cart.processLoadedItems, hookSystem.apply, early return, plugin not loading, hook registration, error handling
`,
      tags: ['hooks', 'troubleshooting', 'empty-cart', 'debugging', 'plugins', 'error-handling']
    };

    // Check if document exists
    const existing = await sequelize.query(`
      SELECT id FROM ai_context_documents
      WHERE title = $1
    `, {
      bind: [document.title],
      type: sequelize.QueryTypes.SELECT
    });

    if (existing.length > 0) {
      console.log('⚠️  Document already exists, updating...');
      await sequelize.query(`
        UPDATE ai_context_documents
        SET content = $1, type = $2, category = $3, mode = $4, priority = $5,
            tags = $6, updated_at = NOW()
        WHERE title = $7
      `, {
        bind: [
          document.content,
          document.type,
          document.category,
          document.mode,
          document.priority,
          JSON.stringify(document.tags),
          document.title
        ],
        type: sequelize.QueryTypes.UPDATE
      });
      console.log('✅ Updated existing document');
    } else {
      console.log('📝 Creating new document...');
      await sequelize.query(`
        INSERT INTO ai_context_documents
        (title, type, category, mode, priority, content, tags, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW(), NOW())
      `, {
        bind: [
          document.title,
          document.type,
          document.category,
          document.mode,
          document.priority,
          document.content,
          JSON.stringify(document.tags)
        ],
        type: sequelize.QueryTypes.INSERT
      });
      console.log('✅ Created new document');
    }

    console.log('\n📋 Document Details:');
    console.log(`   Title: ${document.title}`);
    console.log(`   Type: ${document.type}`);
    console.log(`   Category: ${document.category}`);
    console.log(`   Mode: ${document.mode}`);
    console.log(`   Priority: ${document.priority}`);
    console.log(`   Tags: ${document.tags.join(', ')}`);
    console.log(`   Content: ${document.content.length} characters`);

    console.log('\n✅ Document added to RAG system!');
    console.log('   AI can now reference this when helping with hook issues.');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

addToRAG();
