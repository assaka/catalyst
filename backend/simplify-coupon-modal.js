// Simplify the coupon modal - remove animations, make it super visible
require('dotenv').config();
const { sequelize } = require('./src/database/connection');

const PLUGIN_ID = '4eb11832-5429-4146-af06-de86d319a0e5';

async function simplifyModal() {
  try {
    console.log('🎨 Creating simplified, super-visible modal...\n');

    const hookCode = `function(items, context) {
  console.log('🎁 [Empty Cart Hook] Triggered!');
  console.log('🎁 [Empty Cart Hook] Items:', items);
  console.log('🎁 [Empty Cart Hook] Items count:', items.length);

  if (items.length === 0) {
    console.log('🎁 [Empty Cart Hook] Cart is empty!');

    const modalShown = sessionStorage.getItem('emptyCartCouponShown');
    console.log('🎁 [Empty Cart Hook] Modal already shown?', modalShown);

    if (!modalShown) {
      console.log('🎁 [Empty Cart Hook] Creating SIMPLIFIED modal NOW...');
      sessionStorage.setItem('emptyCartCouponShown', 'true');

      // Create immediately - no setTimeout
      const backdrop = document.createElement('div');
      backdrop.id = 'coupon-modal-backdrop';
      backdrop.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 99999; display: flex; align-items: center; justify-content: center;';

      const modal = document.createElement('div');
      modal.id = 'coupon-modal';
      modal.style.cssText = 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; border-radius: 20px; max-width: 500px; text-align: center; color: white; box-shadow: 0 25px 50px rgba(0,0,0,0.5);';

      modal.innerHTML = \`
        <div style="font-size: 60px; margin-bottom: 20px;">🎁</div>
        <h2 style="font-size: 32px; margin: 0 0 16px 0; font-weight: 700;">Your Cart is Empty!</h2>
        <p style="font-size: 18px; margin-bottom: 30px;">Don't worry! We have a special gift for you.</p>

        <div id="couponCode" style="background: white; color: #667eea; padding: 20px 30px; border-radius: 10px; font-size: 28px; font-weight: bold; letter-spacing: 3px; margin: 25px 0; border: 3px dashed #764ba2; cursor: pointer;">
          SAVE20
        </div>

        <p style="font-size: 16px; margin-bottom: 30px;">Get <strong>20% OFF</strong> on your first purchase!<br/>Click the code to copy it.</p>

        <div style="margin-top: 30px;">
          <button id="shopNowBtn" style="background: white; color: #667eea; border: none; padding: 14px 40px; border-radius: 10px; font-size: 18px; font-weight: 600; cursor: pointer; margin: 0 10px;">
            Start Shopping
          </button>
          <button id="closeBtn" style="background: transparent; border: 2px solid white; color: white; padding: 14px 40px; border-radius: 10px; font-size: 18px; font-weight: 600; cursor: pointer; margin: 0 10px;">
            Close
          </button>
        </div>
      \`;

      backdrop.appendChild(modal);
      document.body.appendChild(backdrop);

      console.log('🎁 [Empty Cart Hook] Modal appended to body!');
      console.log('🎁 [Empty Cart Hook] Backdrop element:', backdrop);
      console.log('🎁 [Empty Cart Hook] Modal visible?', backdrop.offsetWidth > 0);

      // Copy functionality
      document.getElementById('couponCode').onclick = function() {
        console.log('🎁 Copying coupon...');
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

      // Close functionality
      const closeModal = () => {
        console.log('🎁 Closing modal...');
        backdrop.remove();
      };

      document.getElementById('closeBtn').onclick = closeModal;
      backdrop.onclick = (e) => {
        if (e.target === backdrop) closeModal();
      };

      document.getElementById('shopNowBtn').onclick = () => {
        console.log('🎁 Redirecting to products...');
        closeModal();
        window.location.href = '/products';
      };

      console.log('🎁 [Empty Cart Hook] All event listeners attached!');
    }
  }

  console.log('🎁 [Empty Cart Hook] Returning items unchanged');
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

    console.log('✅ Hook updated with SIMPLIFIED modal!');
    console.log('\n📋 Changes:');
    console.log('   - Removed animations (fadeIn, slideIn)');
    console.log('   - Removed setTimeout - shows immediately');
    console.log('   - Increased z-index to 99999');
    console.log('   - Darker backdrop (0.8 opacity)');
    console.log('   - Larger text and padding');
    console.log('   - Unique IDs for debugging');
    console.log('\n🔄 Refresh browser (Ctrl+Shift+R)');
    console.log('   Clear session: sessionStorage.clear()');
    console.log('   Visit /cart with empty cart');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

simplifyModal();
