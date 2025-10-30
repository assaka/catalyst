// Check and create HAMID coupon (simplified)
require('dotenv').config();
const { sequelize } = require('./src/database/connection');

async function checkCreateCoupon() {
  try {
    console.log('🔍 Checking HAMID coupon...\n');

    const coupons = await sequelize.query(`
      SELECT * FROM coupons WHERE code = 'HAMID' LIMIT 1
    `, {
      type: sequelize.QueryTypes.SELECT
    });

    if (coupons.length > 0) {
      console.log('✅ HAMID coupon already exists!');
      console.log(JSON.stringify(coupons[0], null, 2));
    } else {
      console.log('❌ HAMID coupon does not exist');
      console.log('\n📝 Creating HAMID coupon (20% off)...');

      await sequelize.query(`
        INSERT INTO coupons (
          code, discount_type, discount_value, min_purchase_amount, is_active
        ) VALUES (
          'HAMID', 'percentage', 20, 0, true
        )
      `, {
        type: sequelize.QueryTypes.INSERT
      });

      console.log('✅ HAMID coupon created!');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkCreateCoupon();
