// Add debug logging to auto-apply event
require('dotenv').config();
const { sequelize } = require('./src/database/connection');

const PLUGIN_ID = '4eb11832-5429-4146-af06-de86d319a0e5';

async function addDebugToAutoApply() {
  try {
    console.log('🐛 Adding debug logging to auto-apply event...\n');

    const eventCode = `export default function onCartNavigated(data) {
  console.log('🎫 [Auto-Apply] Event triggered');
  console.log('🎫 [Auto-Apply] Cart data:', data);

  // Check if there's a pending coupon to auto-apply
  const shouldAutoApply = sessionStorage.getItem('autoApplyCoupon');
  const pendingCoupon = sessionStorage.getItem('pendingCoupon');

  console.log('🎫 [Auto-Apply] Should auto-apply?', shouldAutoApply);
  console.log('🎫 [Auto-Apply] Pending coupon:', pendingCoupon);

  if (shouldAutoApply === 'true' && pendingCoupon) {
    console.log('🎫 [Auto-Apply] ✅ Conditions met! Auto-applying coupon...');

    // Clear flags
    sessionStorage.removeItem('autoApplyCoupon');
    sessionStorage.removeItem('pendingCoupon');

    // Wait for cart to load, then apply coupon
    setTimeout(() => {
      console.log('🎫 [Auto-Apply] Searching for coupon input...');

      const couponInput = document.querySelector('input[name="couponCode"]') ||
                         document.querySelector('input[placeholder*="coupon"]') ||
                         document.querySelector('input[placeholder*="Coupon"]') ||
                         document.querySelector('#couponCode');

      console.log('🎫 [Auto-Apply] Coupon input found:', !!couponInput);

      if (couponInput) {
        console.log('🎫 [Auto-Apply] Filling input with:', pendingCoupon);
        couponInput.value = pendingCoupon;

        // Trigger input event to update React state
        const event = new Event('input', { bubbles: true });
        couponInput.dispatchEvent(event);

        console.log('🎫 [Auto-Apply] Searching for apply button...');

        // Find apply button
        const applyBtn = couponInput.closest('div')?.querySelector('button') ||
                        document.querySelector('button:contains("Apply")') ||
                        [...document.querySelectorAll('button')].find(btn =>
                          btn.textContent.toLowerCase().includes('apply')
                        );

        console.log('🎫 [Auto-Apply] Apply button found:', !!applyBtn);

        if (applyBtn) {
          console.log('🎫 [Auto-Apply] Clicking apply button...');
          applyBtn.click();
          console.log('🎫 [Auto-Apply] ✅ Coupon should be applied!');
        } else {
          console.log('🎫 [Auto-Apply] ❌ Apply button not found!');
        }
      } else {
        console.log('🎫 [Auto-Apply] ❌ Coupon input not found!');
        console.log('🎫 [Auto-Apply] Available inputs:', document.querySelectorAll('input'));
      }
    }, 1500);
  } else {
    console.log('🎫 [Auto-Apply] ℹ️ No pending coupon to apply');
  }
}`;

    await sequelize.query(`
      UPDATE plugin_events
      SET listener_function = $1, updated_at = NOW()
      WHERE plugin_id = $2 AND file_name = 'auto-apply-coupon.js'
    `, {
      bind: [eventCode, PLUGIN_ID],
      type: sequelize.QueryTypes.UPDATE
    });

    console.log('✅ Auto-apply event updated with debug logging!');
    console.log('\n🔄 Refresh your browser');
    console.log('   Watch for 🎫 [Auto-Apply] messages in console');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

addDebugToAutoApply();
