// Add auto-apply coupon feature - 100% database-driven
require('dotenv').config();
const { sequelize } = require('./src/database/connection');

const PLUGIN_ID = '4eb11832-5429-4146-af06-de86d319a0e5';

async function addAutoApplyFeature() {
  try {
    console.log('🎁 Adding auto-apply coupon feature...\n');

    // 1. Update modal hook with new button and coupon code HAMID
    console.log('1️⃣ Updating modal hook with Apply & Shop button...');

    const hookCode = `function(items, context) {
  if (items.length === 0) {
    const modalShown = sessionStorage.getItem('emptyCartCouponShown');

    if (!modalShown) {
      sessionStorage.setItem('emptyCartCouponShown', 'true');

      const backdrop = document.createElement('div');
      backdrop.id = 'coupon-modal-backdrop';
      backdrop.style.cssText = 'position: fixed !important; top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important; width: 100vw !important; height: 100vh !important; background: rgba(0,0,0,0.85) !important; z-index: 999999 !important; display: flex !important; align-items: center !important; justify-content: center !important;';

      const modal = document.createElement('div');
      modal.id = 'coupon-modal';
      modal.style.cssText = 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important; padding: 50px !important; border-radius: 20px !important; max-width: 500px !important; text-align: center !important; color: white !important; box-shadow: 0 25px 50px rgba(0,0,0,0.5) !important; position: relative !important;';

      modal.innerHTML = \`
        <div style="font-size: 60px; margin-bottom: 20px;">🎁</div>
        <h2 style="font-size: 32px; margin: 0 0 16px 0; font-weight: 700;">Your Cart is Empty!</h2>
        <p style="font-size: 18px; margin-bottom: 30px;">Don't worry! We have a special gift for you.</p>
        <div id="couponCode" style="background: white; color: #667eea; padding: 20px 30px; border-radius: 10px; font-size: 28px; font-weight: bold; letter-spacing: 3px; margin: 25px 0; border: 3px dashed #764ba2; cursor: pointer;">HAMID</div>
        <p style="font-size: 16px; margin-bottom: 30px;">Get <strong>20% OFF</strong> on your first purchase!<br/>Click the code to copy it.</p>
        <div style="margin-top: 30px; display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
          <button id="applyShopBtn" style="background: #10b981; color: white; border: none; padding: 14px 40px; border-radius: 10px; font-size: 18px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">Apply & Shop</button>
          <button id="shopNowBtn" style="background: white; color: #667eea; border: none; padding: 14px 40px; border-radius: 10px; font-size: 18px; font-weight: 600; cursor: pointer;">Just Shop</button>
          <button id="closeBtn" style="background: transparent; border: 2px solid white; color: white; padding: 14px 40px; border-radius: 10px; font-size: 18px; font-weight: 600; cursor: pointer;">Close</button>
        </div>
      \`;

      backdrop.appendChild(modal);
      document.body.appendChild(backdrop);

      setTimeout(() => {
        // Copy coupon code
        const couponEl = document.getElementById('couponCode');
        if (couponEl) {
          couponEl.onclick = function() {
            navigator.clipboard.writeText('HAMID').then(() => {
              this.textContent = '✓ Copied!';
              this.style.background = '#10b981';
              this.style.color = 'white';
              setTimeout(() => {
                this.textContent = 'HAMID';
                this.style.background = 'white';
                this.style.color = '#667eea';
              }, 2000);
            });
          };
        }

        // Apply & Shop button - stores coupon and redirects
        const applyBtn = document.getElementById('applyShopBtn');
        if (applyBtn) {
          applyBtn.onclick = () => {
            sessionStorage.setItem('pendingCoupon', 'HAMID');
            sessionStorage.setItem('autoApplyCoupon', 'true');
            const bd = document.getElementById('coupon-modal-backdrop');
            if (bd) bd.remove();
            window.location.href = '/products';
          };
        }

        // Just Shop button
        const shopBtn = document.getElementById('shopNowBtn');
        if (shopBtn) {
          shopBtn.onclick = () => {
            const bd = document.getElementById('coupon-modal-backdrop');
            if (bd) bd.remove();
            window.location.href = '/products';
          };
        }

        // Close button
        const closeBtn = document.getElementById('closeBtn');
        if (closeBtn) {
          closeBtn.onclick = () => {
            const bd = document.getElementById('coupon-modal-backdrop');
            if (bd) bd.remove();
          };
        }

        // Click backdrop to close
        const bd = document.getElementById('coupon-modal-backdrop');
        if (bd) {
          bd.onclick = (e) => {
            if (e.target === bd) bd.remove();
          };
        }
      }, 100);
    }
  }

  return items;
}`;

    await sequelize.query(`
      UPDATE plugin_hooks
      SET handler_function = $1, updated_at = NOW()
      WHERE plugin_id = $2 AND hook_name = 'cart.processLoadedItems'
    `, {
      bind: [hookCode, PLUGIN_ID],
      type: sequelize.QueryTypes.UPDATE
    });

    console.log('   ✅ Hook updated with Apply & Shop button');

    // 2. Create event listener for cart navigation to auto-apply coupon
    console.log('\n2️⃣ Creating cart navigation event listener...');

    const eventCode = `export default function onCartNavigated(data) {
  // Check if there's a pending coupon to auto-apply
  const shouldAutoApply = sessionStorage.getItem('autoApplyCoupon');
  const pendingCoupon = sessionStorage.getItem('pendingCoupon');

  if (shouldAutoApply === 'true' && pendingCoupon) {
    // Clear flags
    sessionStorage.removeItem('autoApplyCoupon');
    sessionStorage.removeItem('pendingCoupon');

    // Wait for cart to load, then apply coupon
    setTimeout(() => {
      const couponInput = document.querySelector('input[name="couponCode"]') ||
                         document.querySelector('input[placeholder*="coupon"]') ||
                         document.querySelector('#couponCode');

      if (couponInput) {
        couponInput.value = pendingCoupon;

        // Trigger apply button click
        const applyBtn = couponInput.closest('div').querySelector('button') ||
                        document.querySelector('button[type="submit"]');

        if (applyBtn) {
          applyBtn.click();
        }
      }
    }, 1000);
  }
}`;

    // Check if event listener exists
    const existing = await sequelize.query(`
      SELECT id FROM plugin_events
      WHERE plugin_id = $1 AND event_name = 'cart.viewed' AND file_name = 'auto-apply-coupon.js'
    `, {
      bind: [PLUGIN_ID],
      type: sequelize.QueryTypes.SELECT
    });

    if (existing.length > 0) {
      await sequelize.query(`
        UPDATE plugin_events
        SET listener_function = $1, updated_at = NOW()
        WHERE plugin_id = $2 AND file_name = 'auto-apply-coupon.js'
      `, {
        bind: [eventCode, PLUGIN_ID],
        type: sequelize.QueryTypes.UPDATE
      });
      console.log('   ✅ Updated auto-apply event listener');
    } else {
      await sequelize.query(`
        INSERT INTO plugin_events
        (plugin_id, event_name, file_name, listener_function, priority, is_enabled, created_at, updated_at)
        VALUES ($1, 'cart.viewed', 'auto-apply-coupon.js', $2, 5, true, NOW(), NOW())
      `, {
        bind: [PLUGIN_ID, eventCode],
        type: sequelize.QueryTypes.INSERT
      });
      console.log('   ✅ Created auto-apply event listener');
    }

    console.log('\n✅ Auto-apply coupon feature added!');
    console.log('\n📋 How it works:');
    console.log('   1. User visits empty cart → sees modal with HAMID coupon');
    console.log('   2. User clicks "Apply & Shop" button');
    console.log('   3. Coupon stored in sessionStorage');
    console.log('   4. Redirect to /products');
    console.log('   5. When they return to cart with items, coupon auto-applies!');
    console.log('\n🧪 Test:');
    console.log('   1. Clear cart (remove all items)');
    console.log('   2. Visit /cart → modal appears');
    console.log('   3. Click "Apply & Shop"');
    console.log('   4. Add product to cart');
    console.log('   5. Go to cart → HAMID coupon auto-applies!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

addAutoApplyFeature();
