require('dotenv').config();
const { sequelize } = require('./src/database/connection');
const { SeoTemplate } = require('./src/models');

async function fixSeoTemplate() {
  console.log('🔧 Fixing SEO template with syntax error...\n');

  try {
    // Find templates with the malformed variable
    const templates = await SeoTemplate.findAll({
      where: sequelize.where(
        sequelize.fn('JSON_EXTRACT', sequelize.col('template'), '$.meta_title'),
        'LIKE',
        '%{{[product_name}}%'
      )
    });

    console.log(`Found ${templates.length} template(s) with the error\n`);

    for (const template of templates) {
      const currentTitle = template.template?.meta_title || '';
      console.log(`Template ID: ${template.id}`);
      console.log(`Type: ${template.type}`);
      console.log(`Current title: ${currentTitle}`);

      // Fix the syntax error
      const fixedTitle = currentTitle.replace('{{[product_name}}', '{{product_name}}');

      console.log(`Fixed title: ${fixedTitle}\n`);

      // Update the template
      await template.update({
        template: {
          ...template.template,
          meta_title: fixedTitle
        }
      });

      console.log(`✅ Template ${template.id} updated successfully\n`);
    }

    if (templates.length === 0) {
      console.log('ℹ️ No templates found with the syntax error');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

fixSeoTemplate();
