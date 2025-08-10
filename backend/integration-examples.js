// Example integrations showing how ANY feature can use the credit system
const creditService = require('./src/services/credit-service');

// ===============================================
// Example 1: Akeneo Integration
// ===============================================
async function akeneoImport(userId, storeId, importType) {
  try {
    // Before doing the work, deduct credits
    await creditService.deduct(
      userId, 
      storeId, 
      0.1, // Cost for Akeneo import
      `Akeneo ${importType} import`,
      { import_type: importType }
    );
    
    // Do the actual import work here
    console.log(`Performing ${importType} import...`);
    
    return { success: true, message: 'Import completed' };
  } catch (error) {
    if (error.message.includes('Insufficient credits')) {
      return { success: false, error: 'INSUFFICIENT_CREDITS', message: error.message };
    }
    throw error;
  }
}

// ===============================================
// Example 2: Marketplace Export  
// ===============================================
async function exportToMarketplace(userId, storeId, marketplace, productIds) {
  try {
    // Deduct credits before export
    await creditService.deduct(
      userId,
      storeId,
      0.05, // Cost per marketplace export
      `Export to ${marketplace}`,
      { 
        marketplace,
        product_count: productIds.length,
        export_time: new Date().toISOString()
      }
    );
    
    // Do the actual export work
    console.log(`Exporting ${productIds.length} products to ${marketplace}...`);
    
    return { success: true, exported_count: productIds.length };
  } catch (error) {
    if (error.message.includes('Insufficient credits')) {
      return { success: false, error: 'INSUFFICIENT_CREDITS' };
    }
    throw error;
  }
}

// ===============================================
// Example 3: AI Description Generation
// ===============================================
async function generateAIDescription(userId, storeId, productId, productName) {
  try {
    // Deduct credits before AI call
    await creditService.deduct(
      userId,
      storeId,
      0.02, // Cost per AI description
      `AI description for ${productName}`,
      { 
        product_id: productId,
        ai_model: 'gpt-4',
        feature: 'product_description'
      }
    );
    
    // Call AI service here
    const description = `AI-generated description for ${productName}...`;
    
    return { success: true, description };
  } catch (error) {
    if (error.message.includes('Insufficient credits')) {
      return { success: false, error: 'INSUFFICIENT_CREDITS' };
    }
    throw error;
  }
}

// ===============================================
// Example 4: Custom Analytics Report
// ===============================================
async function generateAnalyticsReport(userId, storeId, reportType) {
  try {
    // Different reports cost different amounts
    const costs = {
      'basic': 0.05,
      'advanced': 0.15,
      'premium': 0.30
    };
    
    const cost = costs[reportType] || 0.10;
    
    await creditService.deduct(
      userId,
      storeId,
      cost,
      `${reportType.toUpperCase()} analytics report`,
      { 
        report_type: reportType,
        generated_at: new Date().toISOString()
      }
    );
    
    // Generate the report
    console.log(`Generating ${reportType} analytics report...`);
    
    return { success: true, report_url: `/reports/${reportType}-${Date.now()}.pdf` };
  } catch (error) {
    if (error.message.includes('Insufficient credits')) {
      return { success: false, error: 'INSUFFICIENT_CREDITS' };
    }
    throw error;
  }
}

// ===============================================
// Example 5: Bulk Image Processing
// ===============================================
async function processProductImages(userId, storeId, imageIds) {
  try {
    // Cost based on number of images
    const costPerImage = 0.01;
    const totalCost = imageIds.length * costPerImage;
    
    await creditService.deduct(
      userId,
      storeId,
      totalCost,
      `Process ${imageIds.length} product images`,
      { 
        image_count: imageIds.length,
        cost_per_image: costPerImage,
        processing_type: 'optimization_and_resize'
      }
    );
    
    // Process images
    console.log(`Processing ${imageIds.length} images...`);
    
    return { success: true, processed_count: imageIds.length };
  } catch (error) {
    if (error.message.includes('Insufficient credits')) {
      return { success: false, error: 'INSUFFICIENT_CREDITS' };
    }
    throw error;
  }
}

// ===============================================
// Example 6: Generic Feature Template
// ===============================================
async function anyFeature(userId, storeId, featureConfig) {
  try {
    const { 
      cost, 
      description, 
      metadata = {},
      referenceId = null,
      referenceType = null 
    } = featureConfig;
    
    // Universal credit deduction
    const result = await creditService.deduct(
      userId,
      storeId,
      cost,
      description,
      metadata,
      referenceId,
      referenceType
    );
    
    // Do your feature's work here...
    console.log(`Executing feature: ${description}`);
    
    return { 
      success: true, 
      credits_used: result.credits_deducted,
      remaining_balance: result.remaining_balance 
    };
  } catch (error) {
    if (error.message.includes('Insufficient credits')) {
      return { success: false, error: 'INSUFFICIENT_CREDITS', message: error.message };
    }
    throw error;
  }
}

module.exports = {
  akeneoImport,
  exportToMarketplace,
  generateAIDescription,
  generateAnalyticsReport,
  processProductImages,
  anyFeature
};