// Add debug logging to empty cart coupon hook
require('dotenv').config();
const { sequelize } = require('./src/database/connection');

const PLUGIN_ID = '4eb11832-5429-4146-af06-de86d319a0e5';

async function addDebugToHook() {
  try {
    console.log('🐛 Adding debug logging to hook...\n');

    const hookName = 'cart.processLoadedItems';

    // Hook with extensive debug logging
    const hookCode = `function(items, context) {
  console.log('🎁 [Empty Cart Hook] Triggered!');
  console.log('🎁 [Empty Cart Hook] Items:', items);
  console.log('🎁 [Empty Cart Hook] Items count:', items.length);
  console.log('🎁 [Empty Cart Hook] Context:', context);

  // Check if cart is empty
  if (items.length === 0) {
    console.log('🎁 [Empty Cart Hook] Cart is empty! Checking session...');

    const modalShown = sessionStorage.getItem('emptyCartCouponShown');
    console.log('🎁 [Empty Cart Hook] Modal already shown?', modalShown);

    if (!modalShown) {
      console.log('🎁 [Empty Cart Hook] Showing modal in 1 second...');
      sessionStorage.setItem('emptyCartCouponShown', 'true');

      setTimeout(() => {
        console.log('🎁 [Empty Cart Hook] Creating modal...');

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
        console.log('🎁 [Empty Cart Hook] Modal added to DOM!');

        // Copy coupon code
        modal.querySelector('#couponCode').addEventListener('click', () => {
          console.log('🎁 [Empty Cart Hook] Copying coupon code...');
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
          console.log('🎁 [Empty Cart Hook] Closing modal...');
          backdrop.style.animation = 'fadeOut 0.3s ease-in-out';
          setTimeout(() => backdrop.remove(), 300);
        };

        modal.querySelector('#closeBtn').addEventListener('click', closeModal);
        backdrop.addEventListener('click', (e) => {
          if (e.target === backdrop) closeModal();
        });

        modal.querySelector('#shopNowBtn').addEventListener('click', () => {
          console.log('🎁 [Empty Cart Hook] Redirecting to products...');
          closeModal();
          window.location.href = '/products';
        });
      }, 1000);
    } else {
      console.log('🎁 [Empty Cart Hook] Modal already shown this session. Skipping.');
    }
  } else {
    console.log('🎁 [Empty Cart Hook] Cart has items. Not showing modal.');
  }

  console.log('🎁 [Empty Cart Hook] Returning items...');
  return items;
}`;

    await sequelize.query(`
      UPDATE plugin_hooks
      SET handler_function = $1, updated_at = NOW()
      WHERE plugin_id = $2 AND hook_name = $3
    `, {
      bind: [hookCode, PLUGIN_ID, hookName],
      type: sequelize.QueryTypes.UPDATE
    });

    console.log('✅ Hook updated with debug logging!');
    console.log('\n📋 Now you can:');
    console.log('   1. Refresh your browser (Ctrl+Shift+R to clear cache)');
    console.log('   2. Open DevTools Console (F12)');
    console.log('   3. Clear session: sessionStorage.clear()');
    console.log('   4. Visit /cart with empty cart');
    console.log('   5. Watch console for "🎁 [Empty Cart Hook]" messages');
    console.log('\n🔍 The logs will tell you exactly what\'s happening!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

addDebugToHook();
