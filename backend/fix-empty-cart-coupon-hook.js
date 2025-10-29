// Fix empty cart coupon hook - use proper function format
require('dotenv').config();
const { sequelize } = require('./src/database/connection');

const PLUGIN_ID = '109c940f-5d33-472c-b7df-c48e68c35696';

async function fixEmptyCartCouponHook() {
  try {
    console.log('🔧 Fixing empty cart coupon hook format...\n');

    const hookName = 'cart.processLoadedItems';

    // Hook must be a SINGLE FUNCTION that returns modified value
    // The hookSystem.apply() will call this function with (value, context)
    const hookCode = `function(items, context) {
  // Check if cart is empty
  if (items.length === 0) {
    // Only show modal once per session
    const modalShown = sessionStorage.getItem('emptyCartCouponShown');

    if (!modalShown) {
      sessionStorage.setItem('emptyCartCouponShown', 'true');

      // Wait for page to load
      setTimeout(() => {
        // Create modal backdrop
        const backdrop = document.createElement('div');
        backdrop.style.cssText = \`
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          animation: fadeIn 0.3s ease-in-out;
        \`;

        // Create modal
        const modal = document.createElement('div');
        modal.style.cssText = \`
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 16px;
          padding: 40px;
          max-width: 450px;
          text-align: center;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          color: white;
          animation: slideIn 0.3s ease-in-out;
        \`;

        modal.innerHTML = \`
          <style>
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes slideIn {
              from { transform: translateY(-50px); opacity: 0; }
              to { transform: translateY(0); opacity: 1; }
            }
            @keyframes fadeOut {
              from { opacity: 1; }
              to { opacity: 0; }
            }
            .coupon-code {
              background: white;
              color: #667eea;
              padding: 16px 24px;
              border-radius: 8px;
              font-size: 24px;
              font-weight: bold;
              letter-spacing: 2px;
              margin: 20px 0;
              border: 3px dashed #764ba2;
              cursor: pointer;
              transition: all 0.2s;
            }
            .coupon-code:hover {
              transform: scale(1.05);
              box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            }
            .modal-btn {
              background: white;
              color: #667eea;
              border: none;
              padding: 12px 32px;
              border-radius: 8px;
              font-size: 16px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.2s;
              margin: 0 8px;
            }
            .modal-btn:hover {
              transform: translateY(-2px);
              box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            }
            .modal-btn.secondary {
              background: transparent;
              border: 2px solid white;
              color: white;
            }
          </style>

          <div style="font-size: 48px; margin-bottom: 16px;">🎁</div>
          <h2 style="font-size: 28px; margin: 0 0 12px 0; font-weight: 700;">
            Your Cart is Empty!
          </h2>
          <p style="font-size: 16px; opacity: 0.95; margin-bottom: 24px;">
            Don't worry! We have a special gift for you.
          </p>

          <div class="coupon-code" id="couponCode" title="Click to copy">
            SAVE20
          </div>

          <p style="font-size: 14px; opacity: 0.9; margin-bottom: 24px;">
            Get <strong>20% OFF</strong> on your first purchase!<br/>
            Click the code to copy it.
          </p>

          <div style="margin-top: 32px;">
            <button class="modal-btn" id="shopNowBtn">
              Start Shopping
            </button>
            <button class="modal-btn secondary" id="closeBtn">
              Close
            </button>
          </div>
        \`;

        backdrop.appendChild(modal);
        document.body.appendChild(backdrop);

        // Copy coupon code
        modal.querySelector('#couponCode').addEventListener('click', () => {
          navigator.clipboard.writeText('SAVE20').then(() => {
            const couponEl = modal.querySelector('#couponCode');
            const orig = couponEl.textContent;
            couponEl.textContent = '✓ Copied!';
            couponEl.style.background = '#10b981';
            couponEl.style.color = 'white';
            setTimeout(() => {
              couponEl.textContent = orig;
              couponEl.style.background = 'white';
              couponEl.style.color = '#667eea';
            }, 2000);
          });
        });

        // Close handlers
        const closeModal = () => {
          backdrop.style.animation = 'fadeOut 0.3s ease-in-out';
          setTimeout(() => backdrop.remove(), 300);
        };

        modal.querySelector('#closeBtn').addEventListener('click', closeModal);
        backdrop.addEventListener('click', (e) => {
          if (e.target === backdrop) closeModal();
        });

        modal.querySelector('#shopNowBtn').addEventListener('click', () => {
          closeModal();
          window.location.href = '/products';
        });
      }, 1000);
    }
  }

  // Always return items unchanged (this is a filter hook)
  return items;
}`;

    // Update hook
    await sequelize.query(`
      UPDATE plugin_hooks
      SET handler_function = $1, updated_at = NOW()
      WHERE plugin_id = $2 AND hook_name = $3
    `, {
      bind: [hookCode, PLUGIN_ID, hookName],
      type: sequelize.QueryTypes.UPDATE
    });

    console.log('✅ Hook updated with correct function format!');
    console.log('\n📋 Changes:');
    console.log('   - Converted to single function expression');
    console.log('   - Returns items (required for filter hooks)');
    console.log('   - Properly structured for hookSystem.register()');
    console.log('\n🧪 To test:');
    console.log('   1. Refresh your browser');
    console.log('   2. Clear sessionStorage: sessionStorage.clear()');
    console.log('   3. Visit /cart with empty cart');
    console.log('   4. Modal should appear!');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

fixEmptyCartCouponHook();
