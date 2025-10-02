const { sequelize } = require('./src/database/connection');
const { Slot } = require('./src/models');

async function updateLayeredNavigationSlot() {
  // Test connection
  await sequelize.authenticate();
  console.log('✅ Database connection established');

  try {
    // Find all layered_navigation slots
    const slots = await Slot.findAll({
      where: {
        slot_id: 'layered_navigation',
        page_type: 'category'
      }
    });

    console.log(`Found ${slots.length} layered_navigation slots to update`);

    for (const slot of slots) {
      let content = slot.content;

      // Replace all occurrences of ../../../filterOptionStyles with filterOptionStyles
      const replacements = [
        ['{{../../../filterOptionStyles.optionTextColor}}', '{{filterOptionStyles.optionTextColor}}'],
        ['{{../../../filterOptionStyles.optionHoverColor}}', '{{filterOptionStyles.optionHoverColor}}'],
        ['{{../../../filterOptionStyles.checkboxColor}}', '{{filterOptionStyles.checkboxColor}}'],
        ['{{../../../filterOptionStyles.optionCountColor}}', '{{filterOptionStyles.optionCountColor}}'],
        ['{{../../../filterOptionStyles.activeFilterBgColor}}', '{{filterOptionStyles.activeFilterBgColor}}'],
        ['{{../../../filterOptionStyles.activeFilterTextColor}}', '{{filterOptionStyles.activeFilterTextColor}}']
      ];

      for (const [oldPath, newPath] of replacements) {
        content = content.split(oldPath).join(newPath);
      }

      // Update the slot
      slot.content = content;
      await slot.save();

      console.log(`✅ Updated slot for store_id: ${slot.store_id}`);
    }

    console.log('✅ All layered_navigation slots updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating slots:', error);
    process.exit(1);
  }
}

updateLayeredNavigationSlot();
