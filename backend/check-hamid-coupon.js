// Check if HAMID coupon exists
require('dotenv').config();
const { sequelize } = require('./src/database/connection');

async function checkCoupon() {
  try {
    console.log('🔍 Checking for HAMID coupon...\n');

    const coupons = await sequelize.query(`
      SELECT code, discount_type, discount_value, min_purchase_amount,
             is_active, usage_limit, times_used, valid_from, valid_until
      FROM coupons
      WHERE code = 'HAMID'
    `, {
      type: sequelize.QueryTypes.SELECT
    });

    if (coupons.length === 0) {
      console.log('❌ HAMID coupon does not exist!');
      console.log('\n📝 Creating HAMID coupon...');

      await sequelize.query(`
        INSERT INTO coupons (
          code, discount_type, discount_value, min_purchase_amount,
          is_active, usage_limit, valid_from, valid_until,
          created_at, updated_at
        ) VALUES (
          'HAMID', 'percentage', 20, 0,
          true, NULL, NOW(), NOW() + INTERVAL '1 year',
          NOW(), NOW()
        )
      `, {
        type: sequelize.QueryTypes.INSERT
      });

      console.log('✅ Created HAMID coupon!');
      console.log('   Code: HAMID');
      console.log('   Discount: 20% off');
      console.log('   Min purchase: $0');
      console.log('   Valid for: 1 year');
    } else {
      const coupon = coupons[0];
      console.log('✅ HAMID coupon exists!');
      console.log(`   Code: ${coupon.code}`);
      console.log(`   Discount: ${coupon.discount_value}% off`);
      console.log(`   Active: ${coupon.is_active}`);
      console.log(`   Min purchase: $${coupon.min_purchase_amount}`);
      console.log(`   Usage: ${coupon.times_used || 0}${coupon.usage_limit ? `/${coupon.usage_limit}` : ' (unlimited)'}`);
      console.log(`   Valid: ${coupon.valid_from?.toISOString().split('T')[0]} to ${coupon.valid_until?.toISOString().split('T')[0]}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

checkCoupon();
