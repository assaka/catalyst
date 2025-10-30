// Remove debug logs from empty cart coupon hook
require('dotenv').config();
const { sequelize } = require('./src/database/connection');

const PLUGIN_ID = '4eb11832-5429-4146-af06-de86d319a0e5';

async function cleanHookLogs() {
  try {
    console.log('🧹 Cleaning debug logs from hook...\n');

    const hookCode = `function(items, context) {
  // Check if cart is empty
  if (items.length === 0) {
    const modalShown = sessionStorage.getItem('emptyCartCouponShown');

    if (!modalShown) {
      sessionStorage.setItem('emptyCartCouponShown', 'true');

      // Create backdrop
      const backdrop = document.createElement('div');
      backdrop.id = 'coupon-modal-backdrop';
      backdrop.style.cssText = 'position: fixed !important; top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important; width: 100vw !important; height: 100vh !important; background: rgba(0,0,0,0.85) !important; z-index: 999999 !important; display: flex !important; align-items: center !important; justify-content: center !important;';

      // Create modal
      const modal = document.createElement('div');
      modal.id = 'coupon-modal';
      modal.style.cssText = 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important; padding: 50px !important; border-radius: 20px !important; max-width: 500px !important; text-align: center !important; color: white !important; box-shadow: 0 25px 50px rgba(0,0,0,0.5) !important; position: relative !important;';

      modal.innerHTML = \`
        <div style="font-size: 60px; margin-bottom: 20px;">🎁</div>
        <h2 style="font-size: 32px; margin: 0 0 16px 0; font-weight: 700;">Your Cart is Empty!</h2>
        <p style="font-size: 18px; margin-bottom: 30px;">Don't worry! We have a special gift for you.</p>
        <div id="couponCode" style="background: white; color: #667eea; padding: 20px 30px; border-radius: 10px; font-size: 28px; font-weight: bold; letter-spacing: 3px; margin: 25px 0; border: 3px dashed #764ba2; cursor: pointer;">SAVE20</div>
        <p style="font-size: 16px; margin-bottom: 30px;">Get <strong>20% OFF</strong> on your first purchase!<br/>Click the code to copy it.</p>
        <div style="margin-top: 30px;">
          <button id="shopNowBtn" style="background: white; color: #667eea; border: none; padding: 14px 40px; border-radius: 10px; font-size: 18px; font-weight: 600; cursor: pointer; margin: 0 10px;">Start Shopping</button>
          <button id="closeBtn" style="background: transparent; border: 2px solid white; color: white; padding: 14px 40px; border-radius: 10px; font-size: 18px; font-weight: 600; cursor: pointer; margin: 0 10px;">Close</button>
        </div>
      \`;

      backdrop.appendChild(modal);
      document.body.appendChild(backdrop);

      // Event handlers
      setTimeout(() => {
        const couponEl = document.getElementById('couponCode');
        if (couponEl) {
          couponEl.onclick = function() {
            navigator.clipboard.writeText('SAVE20').then(() => {
              this.textContent = '✓ Copied!';
              this.style.background = '#10b981';
              this.style.color = 'white';
              setTimeout(() => {
                this.textContent = 'SAVE20';
                this.style.background = 'white';
                this.style.color = '#667eea';
              }, 2000);
            });
          };
        }

        const closeBtn = document.getElementById('closeBtn');
        if (closeBtn) {
          closeBtn.onclick = () => {
            const bd = document.getElementById('coupon-modal-backdrop');
            if (bd) bd.remove();
          };
        }

        const shopBtn = document.getElementById('shopNowBtn');
        if (shopBtn) {
          shopBtn.onclick = () => {
            const bd = document.getElementById('coupon-modal-backdrop');
            if (bd) bd.remove();
            window.location.href = '/products';
          };
        }

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

    console.log('✅ Hook cleaned - all debug logs removed!');
    console.log('\n📋 Production-ready hook:');
    console.log('   - No console.log statements');
    console.log('   - Clean, efficient code');
    console.log('   - Ready for production use');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

cleanHookLogs();
