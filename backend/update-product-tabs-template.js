/**
 * Update Product Tabs Template in Database
 *
 * This script updates the product_tabs slot configuration in the database
 * to include the content rendering logic ({{#if (eq this.tab_type "text")}})
 * that was added to product-config.js.
 *
 * Run with: node update-product-tabs-template.js
 */

const { Sequelize } = require('sequelize');

// Database connection
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false
});

const updatedTemplate = `
        <div class="w-full">
          <!-- Desktop: Tab Navigation - Hidden on mobile -->
          <div class="hidden md:block border-b border-gray-200">
            <nav class="-mb-px flex space-x-8">
              {{#each tabs}}
                <button
                  class="py-2 px-1 border-b-2 font-medium transition-colors duration-200 {{#if this.isActive}}{{else}}border-transparent hover:underline{{/if}}"
                  style="font-size: {{settings.theme.product_tabs_title_size}}; {{#if this.isActive}}color: #2563eb; border-color: #2563eb;{{else}}color: #6b7280;{{/if}}"
                  data-action="switch-tab"
                  data-tab-id="{{this.id}}">
                  {{this.title}}
                </button>
              {{/each}}
            </nav>
          </div>

          <!-- Desktop: Tab Content - Hidden on mobile -->
          <div class="hidden md:block mt-6">
            {{#each tabs}}
              <div
                class="tab-panel {{#if this.isActive}}{{else}}hidden{{/if}}"
                data-tab-content="{{this.id}}"
                data-tab-index="{{@index}}"
                data-tab-type="{{this.tab_type}}"
                data-tab-text-content="{{this.content}}">
                <div class="prose max-w-none text-gray-800 leading-relaxed tab-content-container p-6 rounded-lg"
                     style="background-color: {{settings.theme.product_tabs_content_bg}};"
                     data-attributes-template='
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="flex justify-between py-2 border-b border-gray-100">
                      <span class="font-bold capitalize" style="color: {{settings.theme.product_tabs_attribute_label_color}};">__KEY__</span>
                      <span>__VALUE__</span>
                    </div>
                  </div>
                '>
                  {{#if (eq this.tab_type "text")}}
                    <div>{{{this.content}}}</div>
                  {{/if}}

                  {{#if (eq this.tab_type "description")}}
                    {{#if this.content}}
                      <div>{{{this.content}}}</div>
                    {{else}}
                      <div>{{{../product.description}}}</div>
                    {{/if}}
                  {{/if}}

                  {{#if (eq this.tab_type "attributes")}}
                    <div id="attributes-placeholder" data-attributes-container></div>
                  {{/if}}
                </div>
              </div>
            {{/each}}
          </div>

          <!-- Mobile: Accordion - Hidden on desktop -->
          <div class="md:hidden space-y-2">
            {{#each tabs}}
              <div class="border border-gray-200 rounded-lg" data-accordion-item="{{@index}}">
                <!-- Accordion Header -->
                <button
                  class="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors duration-200"
                  data-action="toggle-accordion"
                  data-accordion-index="{{@index}}">
                  <span class="font-medium" style="font-size: {{settings.theme.product_tabs_title_size}}; color: #2563eb;">{{this.title}}</span>
                  <svg
                    class="w-5 h-5 transition-transform duration-200 accordion-chevron"
                    style="color: #2563eb;"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <!-- Accordion Content -->
                <div class="accordion-content {{#if @first}}{{else}}hidden{{/if}} p-4 pt-0 border-t border-gray-200"
                     data-accordion-content="{{@index}}"
                     data-tab-type="{{this.tab_type}}"
                     data-tab-text-content="{{this.content}}">
                  <div class="prose max-w-none text-gray-800 leading-relaxed tab-content-container p-6 rounded-lg"
                       style="background-color: {{settings.theme.product_tabs_content_bg}};"
                       data-attributes-template='
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div class="flex justify-between py-2 border-b border-gray-100">
                        <span class="font-bold capitalize" style="color: {{settings.theme.product_tabs_attribute_label_color}};">__KEY__</span>
                        <span>__VALUE__</span>
                      </div>
                    </div>
                  '>
                    {{#if (eq this.tab_type "text")}}
                      <div>{{{this.content}}}</div>
                    {{/if}}

                    {{#if (eq this.tab_type "description")}}
                      {{#if this.content}}
                        <div>{{{this.content}}}</div>
                      {{else}}
                        <div>{{{../product.description}}}</div>
                      {{/if}}
                    {{/if}}

                    {{#if (eq this.tab_type "attributes")}}
                      <div id="attributes-placeholder-mobile" data-attributes-container></div>
                    {{/if}}
                  </div>
                </div>
              </div>
            {{/each}}
          </div>
        </div>
      `;

async function updateProductTabsTemplate() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database');

    // Update all product_tabs slots across all stores
    const [results] = await sequelize.query(`
      UPDATE slot_configurations
      SET configuration = jsonb_set(
            configuration,
            '{slots,product_tabs,content}',
            to_jsonb(:template::text)
          ),
          updated_at = NOW()
      WHERE page_type = 'product_layout'
      AND configuration->'slots'->'product_tabs' IS NOT NULL
      RETURNING store_id, version;
    `, {
      replacements: { template: updatedTemplate }
    });

    console.log(`✅ Updated ${results.length} product_tabs slot(s)`);
    results.forEach(row => {
      console.log(`   - Store ID: ${row.store_id}, Version: ${row.version}`);
    });

    await sequelize.close();
    console.log('✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

updateProductTabsTemplate();
