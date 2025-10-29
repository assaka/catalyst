// Add empty cart coupon hook to Cart Hamid plugin
require('dotenv').config();
const { sequelize } = require('./src/database/connection');

const PLUGIN_ID = '109c940f-5d33-472c-b7df-c48e68c35696';

async function addEmptyCartCouponHook() {
  try {
    console.log('🎁 Adding empty cart coupon hook to Cart Hamid plugin...\n');

    // Create hook for checking empty cart and showing coupon modal
    const hookName = 'cart.processLoadedItems';
    const hookCode = `// Empty Cart Coupon Hook
// Shows a coupon code modal when cart is empty

function processLoadedItems(items, context) {
  // Check if cart is empty
  if (items.length === 0) {
    // Only show modal once per session
    const modalShown = sessionStorage.getItem('emptyCartCouponShown');

    if (!modalShown) {
      // Mark as shown
      sessionStorage.setItem('emptyCartCouponShown', 'true');

      // Wait a bit for page to fully load
      setTimeout(() => {
        showCouponModal();
      }, 1000);
    }
  }

  // Always return items unchanged (this is a filter hook)
  return items;
}

function showCouponModal() {
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

  // Copy coupon code on click
  const couponCode = modal.querySelector('#couponCode');
  couponCode.addEventListener('click', () => {
    navigator.clipboard.writeText('SAVE20').then(() => {
      const originalText = couponCode.textContent;
      couponCode.textContent = '✓ Copied!';
      couponCode.style.background = '#10b981';
      couponCode.style.color = 'white';

      setTimeout(() => {
        couponCode.textContent = originalText;
        couponCode.style.background = 'white';
        couponCode.style.color = '#667eea';
      }, 2000);
    });
  });

  // Close modal
  const closeModal = () => {
    backdrop.style.animation = 'fadeOut 0.3s ease-in-out';
    setTimeout(() => backdrop.remove(), 300);
  };

  modal.querySelector('#closeBtn').addEventListener('click', closeModal);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeModal();
  });

  // Shop now button - redirect to products
  modal.querySelector('#shopNowBtn').addEventListener('click', () => {
    closeModal();
    // Redirect to products page (adjust URL as needed)
    window.location.href = '/products';
  });
}

// Add fadeOut animation
const style = document.createElement('style');
style.textContent = \`
  @keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }
\`;
document.head.appendChild(style);

console.log('🎁 Empty cart coupon hook loaded');

// Return the items unchanged
return processLoadedItems(items, context);
`;

    // Check if hook already exists
    const existing = await sequelize.query(`
      SELECT id FROM plugin_hooks
      WHERE plugin_id = $1 AND hook_name = $2
    `, {
      bind: [PLUGIN_ID, hookName],
      type: sequelize.QueryTypes.SELECT
    });

    if (existing.length > 0) {
      // Update existing hook
      await sequelize.query(`
        UPDATE plugin_hooks
        SET handler_function = $1, updated_at = NOW()
        WHERE plugin_id = $2 AND hook_name = $3
      `, {
        bind: [hookCode, PLUGIN_ID, hookName],
        type: sequelize.QueryTypes.UPDATE
      });
      console.log(`✅ Updated hook: ${hookName}`);
    } else {
      // Insert new hook
      await sequelize.query(`
        INSERT INTO plugin_hooks (plugin_id, hook_name, handler_function, priority, is_enabled, created_at, updated_at)
        VALUES ($1, $2, $3, 10, true, NOW(), NOW())
      `, {
        bind: [PLUGIN_ID, hookName, hookCode],
        type: sequelize.QueryTypes.INSERT
      });
      console.log(`✅ Created hook: ${hookName}`);
    }

    console.log('\n✅ Empty cart coupon hook added successfully!');
    console.log('\n📋 Hook Details:');
    console.log(`   Hook: ${hookName}`);
    console.log(`   Plugin: Cart Hamid`);
    console.log(`   Features:`);
    console.log(`     - Shows modal when cart is empty`);
    console.log(`     - Displays coupon code: SAVE20`);
    console.log(`     - Click to copy coupon`);
    console.log(`     - Only shows once per session`);
    console.log(`     - "Start Shopping" redirects to /products`);
    console.log('\n🧪 To test:');
    console.log('   1. Clear your cart (remove all items)');
    console.log('   2. Visit /cart page');
    console.log('   3. Modal should appear with coupon code');
    console.log('   4. Click code to copy it');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

addEmptyCartCouponHook();
