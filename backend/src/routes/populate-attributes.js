const express = require('express');
const { Product, Attribute, AttributeSet } = require('../models');
const authMiddleware = require('../middleware/auth');
const { authorize } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/populate-attributes
// @desc    Populate attributes for existing products (temporary utility)
// @access  Admin only
router.post('/', authMiddleware, authorize(['admin']), async (req, res) => {
  try {
    const { store_id, attribute_mappings } = req.body;
    
    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    // Get all products for the store
    const products = await Product.findAll({
      where: { store_id: store_id }
    });

    let updatedCount = 0;
    
    for (const product of products) {
      const currentAttributes = product.attributes || {};
      let newAttributes = { ...currentAttributes };
      let shouldUpdate = false;
      
      // Auto-assign color based on product name if not already set
      if (!currentAttributes.color) {
        const productName = product.name.toLowerCase();
        let color = null;
        
        if (productName.includes('red')) color = 'red';
        else if (productName.includes('blue')) color = 'blue';
        else if (productName.includes('green')) color = 'green';
        else if (productName.includes('black')) color = 'black';
        else if (productName.includes('white')) color = 'white';
        else if (productName.includes('yellow')) color = 'yellow';
        else if (productName.includes('orange')) color = 'orange';
        else if (productName.includes('purple')) color = 'purple';
        else if (productName.includes('pink')) color = 'pink';
        else if (productName.includes('brown')) color = 'brown';
        else if (productName.includes('gray') || productName.includes('grey')) color = 'gray';
        
        if (color) {
          newAttributes.color = color;
          shouldUpdate = true;
        }
      }
      
      // Apply custom attribute mappings if provided
      if (attribute_mappings && Array.isArray(attribute_mappings)) {
        for (const mapping of attribute_mappings) {
          const { product_id, attributes } = mapping;
          if (product.id === product_id) {
            newAttributes = { ...newAttributes, ...attributes };
            shouldUpdate = true;
          }
        }
      }
      
      if (shouldUpdate) {
        await product.update({
          attributes: newAttributes
        });
        updatedCount++;
        
        console.log(`Updated ${product.name} with attributes:`, newAttributes);
      }
    }

    res.json({
      success: true,
      message: `Updated ${updatedCount} products with attribute values`,
      data: {
        total_products: products.length,
        updated_products: updatedCount
      }
    });

  } catch (error) {
    console.error('Populate attributes error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/populate-attributes/preview
// @desc    Preview what attributes would be assigned
// @access  Admin only
router.get('/preview', authMiddleware, authorize(['admin']), async (req, res) => {
  try {
    const { store_id } = req.query;
    
    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    const products = await Product.findAll({
      where: { store_id: store_id },
      attributes: ['id', 'name', 'attributes']
    });

    const preview = products.map(product => {
      const currentAttributes = product.attributes || {};
      const productName = product.name.toLowerCase();
      
      let suggestedColor = null;
      if (!currentAttributes.color) {
        if (productName.includes('red')) suggestedColor = 'red';
        else if (productName.includes('blue')) suggestedColor = 'blue';
        else if (productName.includes('green')) suggestedColor = 'green';
        else if (productName.includes('black')) suggestedColor = 'black';
        else if (productName.includes('white')) suggestedColor = 'white';
        else if (productName.includes('yellow')) suggestedColor = 'yellow';
        else if (productName.includes('orange')) suggestedColor = 'orange';
        else if (productName.includes('purple')) suggestedColor = 'purple';
        else if (productName.includes('pink')) suggestedColor = 'pink';
        else if (productName.includes('brown')) suggestedColor = 'brown';
        else if (productName.includes('gray') || productName.includes('grey')) suggestedColor = 'gray';
      }
      
      return {
        id: product.id,
        name: product.name,
        current_attributes: currentAttributes,
        suggested_color: suggestedColor,
        will_be_updated: !!suggestedColor && !currentAttributes.color
      };
    });

    res.json({
      success: true,
      data: {
        products: preview,
        summary: {
          total_products: products.length,
          products_with_color: preview.filter(p => p.current_attributes.color).length,
          products_to_update: preview.filter(p => p.will_be_updated).length
        }
      }
    });

  } catch (error) {
    console.error('Preview attributes error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/populate-attributes/setup-complete
// @desc    Complete attribute system setup - create Color attribute, attribute set, and assign to products
// @access  Admin only
router.post('/setup-complete', authMiddleware, authorize(['admin']), async (req, res) => {
  try {
    const { store_id } = req.body;
    
    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    const setup = {
      colorAttribute: null,
      attributeSet: null,
      updatedProducts: 0,
      errors: []
    };

    // Step 1: Create or find Color attribute
    try {
      let colorAttribute = await Attribute.findOne({
        where: { 
          store_id: store_id,
          code: 'color'
        }
      });

      if (!colorAttribute) {
        colorAttribute = await Attribute.create({
          name: 'Color',
          code: 'color',
          type: 'select',
          is_filterable: true,
          is_required: false,
          store_id: store_id,
          options: [
            {label: 'Red', value: 'red'},
            {label: 'Blue', value: 'blue'},
            {label: 'Green', value: 'green'},
            {label: 'Black', value: 'black'},
            {label: 'White', value: 'white'},
            {label: 'Yellow', value: 'yellow'},
            {label: 'Orange', value: 'orange'},
            {label: 'Purple', value: 'purple'},
            {label: 'Pink', value: 'pink'},
            {label: 'Brown', value: 'brown'},
            {label: 'Gray', value: 'gray'}
          ]
        });
        console.log('✅ Created Color attribute:', colorAttribute.id);
      } else {
        console.log('✅ Found existing Color attribute:', colorAttribute.id);
      }
      
      setup.colorAttribute = colorAttribute;
    } catch (error) {
      setup.errors.push(`Color attribute creation failed: ${error.message}`);
    }

    // Step 2: Create or find Default Attribute Set
    try {
      let attributeSet = await AttributeSet.findOne({
        where: {
          store_id: store_id,
          name: 'Default Product Set'
        }
      });

      if (!attributeSet && setup.colorAttribute) {
        attributeSet = await AttributeSet.create({
          name: 'Default Product Set',
          description: 'Default attributes for all products',
          store_id: store_id,
          attribute_ids: [setup.colorAttribute.id]
        });
        console.log('✅ Created Default Attribute Set:', attributeSet.id);
      } else if (attributeSet && setup.colorAttribute) {
        // Ensure Color attribute is in the set
        const currentIds = attributeSet.attribute_ids || [];
        if (!currentIds.includes(setup.colorAttribute.id)) {
          await attributeSet.update({
            attribute_ids: [...currentIds, setup.colorAttribute.id]
          });
          console.log('✅ Added Color to existing Attribute Set');
        }
      }
      
      setup.attributeSet = attributeSet;
    } catch (error) { 
      setup.errors.push(`Attribute set creation failed: ${error.message}`);
    }

    // Step 3: Update all products
    if (setup.attributeSet) {
      try {
        const products = await Product.findAll({
          where: { store_id: store_id }
        });

        for (const product of products) {
          const updates = {};
          let shouldUpdate = false;

          // Assign to attribute set if not already assigned
          if (!product.attribute_set_id) {
            updates.attribute_set_id = setup.attributeSet.id;
            shouldUpdate = true;
          }

          // Auto-assign color based on product name
          const currentAttributes = product.attributes || {};
          if (!currentAttributes.color) {
            const productName = product.name.toLowerCase();
            let color = null;
            
            if (productName.includes('red')) color = 'red';
            else if (productName.includes('blue')) color = 'blue';
            else if (productName.includes('green')) color = 'green';
            else if (productName.includes('black')) color = 'black';
            else if (productName.includes('white')) color = 'white';
            else if (productName.includes('yellow')) color = 'yellow';
            else if (productName.includes('orange')) color = 'orange';
            else if (productName.includes('purple')) color = 'purple';
            else if (productName.includes('pink')) color = 'pink';
            else if (productName.includes('brown')) color = 'brown';
            else if (productName.includes('gray') || productName.includes('grey')) color = 'gray';
            else color = 'blue'; // default color
            
            updates.attributes = { ...currentAttributes, color: color };
            shouldUpdate = true;
          }

          if (shouldUpdate) {
            await product.update(updates);
            setup.updatedProducts++;
            console.log(`✅ Updated ${product.name}: ${JSON.stringify(updates)}`);
          }
        }
      } catch (error) {
        setup.errors.push(`Product updates failed: ${error.message}`);
      }
    }

    res.json({
      success: setup.errors.length === 0,
      message: `Attribute system setup completed. Updated ${setup.updatedProducts} products.`,
      data: {
        color_attribute_id: setup.colorAttribute?.id,
        attribute_set_id: setup.attributeSet?.id,
        updated_products: setup.updatedProducts,
        errors: setup.errors
      }
    });

  } catch (error) {
    console.error('Setup complete error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/populate-attributes/setup-preview
// @desc    Preview what the complete setup would do
// @access  Admin only
router.get('/setup-preview', authMiddleware, authorize(['admin']), async (req, res) => {
  try {
    const { store_id } = req.query;
    
    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    // Check existing setup
    const colorAttribute = await Attribute.findOne({
      where: { store_id: store_id, code: 'color' }
    });

    const attributeSet = await AttributeSet.findOne({
      where: { store_id: store_id, name: 'Default Product Set' }
    });

    const products = await Product.findAll({
      where: { store_id: store_id },
      attributes: ['id', 'name', 'attribute_set_id', 'attributes']
    });

    const preview = {
      current_state: {
        has_color_attribute: !!colorAttribute,
        has_attribute_set: !!attributeSet,
        products_with_attribute_set: products.filter(p => p.attribute_set_id).length,
        products_with_color: products.filter(p => p.attributes?.color).length,
        total_products: products.length
      },
      actions_needed: {
        create_color_attribute: !colorAttribute,
        create_attribute_set: !attributeSet,
        assign_products_to_set: products.filter(p => !p.attribute_set_id).length,
        assign_colors_to_products: products.filter(p => !p.attributes?.color).length
      },
      product_preview: products.slice(0, 5).map(product => {
        const productName = product.name.toLowerCase();
        let suggestedColor = 'blue'; // default
        
        if (productName.includes('red')) suggestedColor = 'red';
        else if (productName.includes('blue')) suggestedColor = 'blue';
        else if (productName.includes('green')) suggestedColor = 'green';
        else if (productName.includes('black')) suggestedColor = 'black';
        else if (productName.includes('white')) suggestedColor = 'white';
        
        return {
          id: product.id,
          name: product.name,
          current_attribute_set: product.attribute_set_id,
          current_color: product.attributes?.color,
          suggested_color: suggestedColor,
          needs_attribute_set: !product.attribute_set_id,
          needs_color: !product.attributes?.color
        };
      })
    };

    res.json({
      success: true,
      data: preview
    });

  } catch (error) {
    console.error('Setup preview error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;