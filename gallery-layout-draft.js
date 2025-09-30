// DRAFT: Simplified Gallery Layout Configuration
// This is a test layout to fix the duplicate thumbnails issue

export const simplifiedGalleryConfig = {
  // Gallery container with dynamic layout classes
  product_gallery_container: {
    id: 'product_gallery_container',
    type: 'flex',
    content: '',
    className: '{{#if (eq settings.product_gallery_layout "vertical")}}flex {{#if (eq settings.vertical_gallery_position "left")}}flex-row{{else}}flex-row-reverse{{/if}} gap-4{{else}}flex flex-col gap-4{{/if}} w-full',
    parentClassName: '',
    styles: {},
    parentId: 'content_area',
    position: { col: 1, row: 1 },
    layout: 'flex',
    colSpan: {
      default: 'col-span-12 lg:col-span-6'
    },
    viewMode: ['default'],
    metadata: { hierarchical: true }
  },

  // SINGLE thumbnails slot that handles ALL positions
  product_thumbnails: {
    id: 'product_thumbnails',
    type: 'html',
    content: `<div class="{{#if (eq settings.product_gallery_layout 'vertical')}}flex flex-col space-y-2 w-24{{else}}flex overflow-x-auto space-x-2 mt-4{{/if}}">
      {{#if product.images}}
        {{#each product.images}}
          <button class="relative group flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 border-gray-300 hover:border-gray-400 transition-all duration-200 hover:shadow-md">
            <img src="{{this}}" alt="Thumbnail" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" onerror="this.src='https://placehold.co/100x100?text=Thumb'" />
          </button>
        {{/each}}
      {{else}}
        <button class="relative group flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 border-gray-300">
          <img src="https://placehold.co/100x100?text=T1" alt="Demo Thumbnail" class="w-full h-full object-cover" />
        </button>
        <button class="relative group flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 border-gray-300">
          <img src="https://placehold.co/100x100?text=T2" alt="Demo Thumbnail" class="w-full h-full object-cover" />
        </button>
        <button class="relative group flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 border-gray-300">
          <img src="https://placehold.co/100x100?text=T3" alt="Demo Thumbnail" class="w-full h-full object-cover" />
        </button>
        <button class="relative group flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 border-gray-300">
          <img src="https://placehold.co/100x100?text=T4" alt="Demo Thumbnail" class="w-full h-full object-cover" />
        </button>
      {{/if}}
    </div>`,
    className: '',
    parentClassName: '',
    styles: {},
    parentId: 'product_gallery_container',
    position: { col: 1, row: 1 }, // Will be positioned by flex-row/flex-row-reverse in container
    colSpan: {},
    viewMode: ['default'],
    metadata: { hierarchical: true }
  },

  // Main product image with integrated labels
  product_main_image: {
    id: 'product_main_image',
    type: 'html',
    content: `<div class="flex-1 relative">
      <div class="aspect-square bg-gray-100 rounded-lg overflow-hidden w-full max-w-2xl relative">
        {{#if product.images}}
          <img src="{{product.images.0}}" alt="{{product.name}}" class="w-full h-full object-cover" onerror="this.src='https://placehold.co/600x600?text=No+Image'" />
        {{else}}
          <img src="https://placehold.co/600x600?text=No+Image" alt="No Image" class="w-full h-full object-cover" />
        {{/if}}

        <!-- Product Labels Overlay -->
        {{#if productLabels}}
          <div class="absolute top-2 right-2 flex flex-col space-y-1 pointer-events-none z-50">
            {{#each productLabels}}
              <div style="background-color: {{this.background_color}}; color: {{#if this.text_color}}{{this.text_color}}{{else}}#ffffff{{/if}};" class="text-xs font-semibold px-2 py-1 rounded-md shadow-sm">
                {{this.text}}
              </div>
            {{/each}}
          </div>
        {{else}}
          <!-- Demo labels for editor when no productLabels data -->
          <div class="absolute top-2 right-2 flex flex-col space-y-1 pointer-events-none z-50">
            <div style="background-color: #dc2626; color: #ffffff;" class="text-xs font-semibold px-2 py-1 rounded-md shadow-sm">
              DHL
            </div>
            <div style="background-color: #059669; color: #ffffff;" class="text-xs font-semibold px-2 py-1 rounded-md shadow-sm">
              Hamid
            </div>
          </div>
        {{/if}}
      </div>
    </div>`,
    className: '',
    parentClassName: '',
    styles: {},
    parentId: 'product_gallery_container',
    position: { col: 2, row: 1 }, // Will be positioned by flex-row/flex-row-reverse in container
    colSpan: {},
    viewMode: ['default'],
    metadata: { hierarchical: true }
  }
};

/*
How this works:

1. Container uses flex-row (thumbnails left) or flex-row-reverse (thumbnails right)
2. Only ONE thumbnails slot - no duplicates
3. Flex order handles positioning automatically:
   - vertical + left: flex-row (thumbnails first, then main image)
   - vertical + right: flex-row-reverse (main image first, then thumbnails)
   - horizontal: flex-col (main image above, thumbnails below)

Expected layout for "vertical right":
- Container: flex flex-row-reverse gap-4
- Order: [main image] [thumbnails] (because of reverse)
- Result: thumbnails appear on the right side
*/