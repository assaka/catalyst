/**
 * Mock category data generator for editor preview
 */

export const generateMockCategoryContext = () => {
  const brands = ['Apple', 'Samsung', 'Google', 'OnePlus', 'Sony', 'LG'];
  const colors = ['Black', 'White', 'Blue', 'Red', 'Silver', 'Gold'];
  const sizes = ['Small', 'Medium', 'Large', 'XL', 'XXL'];
  const materials = ['Cotton', 'Polyester', 'Leather', 'Metal', 'Plastic', 'Glass'];

  const sampleProducts = Array.from({ length: 6 }, (_, i) => {
    return {
      id: i + 1,
      name: `Sample Product ${i + 1}`,
      description: `Description for sample product ${i + 1}`,
      price: 99.99 + (i * 50),
      compare_price: i % 2 ? 99.99 + (i * 50) + 20 : null,
      images: [`https://images.unsplash.com/photo-150574042${i}928-5e560c06d30e?w=400&h=400&fit=crop`],
      stock_status: 'in_stock',
      rating: 4.0 + (i % 10) * 0.1,
      slug: `sample-product-${i + 1}`,
      attributes: {
        color: colors[i % colors.length],
        brand: brands[i % brands.length],
        size: sizes[i % sizes.length],
        material: materials[i % materials.length]
      }
    };
  });

  return {
    category: {
      id: 1,
      name: 'Sample Category',
      description: 'This is a sample category for the editor preview',
      slug: 'sample-category'
    },
    products: sampleProducts,
    allProducts: sampleProducts,
    filters: {},
    filterableAttributes: [
      {
        code: 'color',
        name: 'Color',
        is_filterable: true,
        options: colors.map(color => ({ value: color, label: color }))
      },
      {
        code: 'brand',
        name: 'Brand',
        is_filterable: true,
        options: brands.map(brand => ({ value: brand, label: brand }))
      },
      {
        code: 'size',
        name: 'Size',
        is_filterable: true,
        options: sizes.map(size => ({ value: size, label: size }))
      },
      {
        code: 'material',
        name: 'Material',
        is_filterable: true,
        options: materials.map(material => ({ value: material, label: material }))
      }
    ],
    sortOption: 'default',
    currentPage: 1,
    totalPages: 1,
    subcategories: [],
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Sample Category', url: '/sample' }
    ],
    selectedFilters: {},
    settings: { currency_symbol: '$' },
    store: { id: 1, name: 'Demo Store', code: 'demo' },
    productLabels: [
      {
        id: 'new',
        name: 'New',
        text: 'New',
        background_color: '#10B981',
        color: '#FFFFFF',
        text_color: '#FFFFFF',
        position: 'top-left',
        priority: 1,
        conditions: {
          product_ids: [1, 3]  // Products 1 and 3 get "New" label
        }
      },
      {
        id: 'sale',
        name: 'Sale',
        text: 'Sale',
        background_color: '#EF4444',
        color: '#FFFFFF',
        text_color: '#FFFFFF',
        position: 'top-left',
        priority: 2,
        conditions: {
          product_ids: [2]  // Product 2 gets "Sale" label
        }
      },
      {
        id: 'bestseller',
        name: 'Bestseller',
        text: 'Bestseller',
        background_color: '#F59E0B',
        color: '#FFFFFF',
        text_color: '#FFFFFF',
        position: 'top-right',
        priority: 1,
        conditions: {
          product_ids: [1, 4]  // Products 1 and 4 get "Bestseller" label
        }
      }
    ],
    handleFilterChange: () => {},
    handleSortChange: () => {},
    handlePageChange: () => {},
    clearFilters: () => {},
    formatDisplayPrice: (price) => `$${price}`,
    getProductImageUrl: (product) => product?.images?.[0] || '/placeholder-product.jpg',
    navigate: () => {},
    onProductClick: () => {}
  };
};