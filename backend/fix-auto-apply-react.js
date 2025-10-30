// Fix auto-apply to work with React state properly
require('dotenv').config();
const { sequelize } = require('./src/database/connection');

const PLUGIN_ID = '4eb11832-5429-4146-af06-de86d319a0e5';

async function fixAutoApply() {
  try {
    console.log('🔧 Fixing auto-apply to work with React state...\n');

    const eventCode = `export default function onCartNavigated(data) {
  console.log('🎫 [Auto-Apply] Event triggered');

  const shouldAutoApply = sessionStorage.getItem('autoApplyCoupon');
  const pendingCoupon = sessionStorage.getItem('pendingCoupon');

  console.log('🎫 [Auto-Apply] Pending coupon:', pendingCoupon);

  if (shouldAutoApply === 'true' && pendingCoupon) {
    console.log('🎫 [Auto-Apply] Auto-applying coupon...');

    // Clear flags immediately
    sessionStorage.removeItem('autoApplyCoupon');
    sessionStorage.removeItem('pendingCoupon');

    // Wait for cart to fully load
    setTimeout(() => {
      console.log('🎫 [Auto-Apply] Searching for coupon input...');

      // Find coupon input field
      const couponInput = document.querySelector('input[name="couponCode"]') ||
                         document.querySelector('input[placeholder*="oupon"]') ||
                         [...document.querySelectorAll('input')].find(inp =>
                           inp.placeholder?.toLowerCase().includes('coupon') ||
                           inp.name?.toLowerCase().includes('coupon')
                         );

      console.log('🎫 [Auto-Apply] Input found:', !!couponInput);

      if (couponInput) {
        // Fill input value
        couponInput.value = pendingCoupon;

        // Trigger React onChange event
        const inputEvent = new Event('input', { bubbles: true });
        couponInput.dispatchEvent(inputEvent);

        // Also trigger change event for compatibility
        const changeEvent = new Event('change', { bubbles: true });
        couponInput.dispatchEvent(changeEvent);

        console.log('🎫 [Auto-Apply] Input filled with:', pendingCoupon);

        // Wait for React to update, then click apply
        setTimeout(() => {
          // Find apply button next to coupon input
          const form = couponInput.closest('form') || couponInput.closest('div');
          const applyBtn = form?.querySelector('button[type="submit"]') ||
                          form?.querySelector('button') ||
                          [...document.querySelectorAll('button')].find(btn =>
                            btn.textContent?.toLowerCase().includes('apply')
                          );

          console.log('🎫 [Auto-Apply] Apply button found:', !!applyBtn);

          if (applyBtn) {
            console.log('🎫 [Auto-Apply] Clicking apply button...');
            applyBtn.click();
            console.log('🎫 [Auto-Apply] ✅ Done!');
          } else {
            console.log('🎫 [Auto-Apply] ❌ Apply button not found');
            console.log('🎫 [Auto-Apply] All buttons:', [...document.querySelectorAll('button')].map(b => b.textContent));
          }
        }, 300);
      } else {
        console.log('🎫 [Auto-Apply] ❌ Coupon input not found');
        console.log('🎫 [Auto-Apply] All inputs:', [...document.querySelectorAll('input')].map(i => ({ name: i.name, placeholder: i.placeholder })));
      }
    }, 2000);
  } else {
    console.log('🎫 [Auto-Apply] No pending coupon');
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

    console.log('✅ Auto-apply event updated!');
    console.log('\n📋 Changes:');
    console.log('   - Dispatches input AND change events (React compatibility)');
    console.log('   - Increased wait time to 2 seconds');
    console.log('   - Better button finding logic');
    console.log('   - More detailed debug logging');
    console.log('\n🔄 Refresh browser and test!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

fixAutoApply();
