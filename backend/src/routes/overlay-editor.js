const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { CodeCustomization, AIGenerationLog } = require('../models');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get customizations for a specific template
router.get('/customizations/:template', async (req, res) => {
  try {
    const { template } = req.params;
    const userId = req.user.id;

    const customization = await CodeCustomization.findOne({
      where: {
        user_id: userId,
        component_name: template,
      },
      order: [['updated_at', 'DESC']]
    });

    if (!customization) {
      return res.json({
        success: true,
        customization: null,
      });
    }

    res.json({
      success: true,
      customization: {
        code: customization.customizations.code,
        backgroundColor: customization.customizations.styles?.backgroundColor,
        textColor: customization.customizations.styles?.textColor,
        customCSS: customization.customizations.styles?.customCSS,
        modified: true,
      },
    });
  } catch (error) {
    console.error('Error fetching customizations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customizations',
    });
  }
});

// Save customizations for a template
router.post('/customizations/:template', async (req, res) => {
  try {
    const { template } = req.params;
    const { customizations, content } = req.body;
    const userId = req.user.id;

    // Find existing customization or create new one
    let customization = await CodeCustomization.findOne({
      where: {
        user_id: userId,
        component_name: template,
      }
    });

    const customizationData = {
      code: content,
      styles: {
        backgroundColor: customizations.backgroundColor,
        textColor: customizations.textColor,
        customCSS: customizations.customCSS,
      },
      metadata: {
        template,
        lastModified: new Date(),
      }
    };

    if (customization) {
      // Update existing
      await customization.update({
        customizations: customizationData,
        component_code: content,
      });
    } else {
      // Create new
      customization = await CodeCustomization.create({
        user_id: userId,
        store_id: req.headers['x-store-id'] || userId, // Use store ID if available
        component_name: template,
        component_type: 'overlay-template',
        customizations: customizationData,
        component_code: content,
        ai_prompt: null,
        version: 1,
        is_active: true,
      });
    }

    res.json({
      success: true,
      customization: {
        id: customization.id,
        template,
        data: customizationData,
      },
    });
  } catch (error) {
    console.error('Error saving customizations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save customizations',
    });
  }
});

// Generate customization with AI
router.post('/generate-customization', async (req, res) => {
  try {
    const { template, prompt, currentCustomizations } = req.body;
    const userId = req.user.id;

    // Log the AI generation request
    const logData = {
      user_id: userId,
      store_id: req.headers['x-store-id'] || userId,
      component_name: template,
      ai_prompt: prompt,
      input_data: {
        template,
        currentCustomizations,
      },
      processing_time_ms: 0,
    };

    const startTime = Date.now();

    try {
      // Mock AI response for now (replace with actual Claude API call)
      const aiResponse = await generateCustomizationWithAI(template, prompt, currentCustomizations);
      
      logData.processing_time_ms = Date.now() - startTime;
      logData.output_data = aiResponse;
      logData.success = true;

      // Create AI generation log
      await AIGenerationLog.create(logData);

      res.json({
        success: true,
        customizations: aiResponse.customizations,
        generatedCode: aiResponse.generatedCode,
        explanation: aiResponse.explanation,
      });
    } catch (aiError) {
      logData.processing_time_ms = Date.now() - startTime;
      logData.success = false;
      logData.error_message = aiError.message;
      
      await AIGenerationLog.create(logData);
      throw aiError;
    }
  } catch (error) {
    console.error('Error generating customization with AI:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate customization',
    });
  }
});

// Deploy customizations to Render
router.post('/deploy-customizations', async (req, res) => {
  try {
    const { customizations } = req.body;
    const userId = req.user.id;

    // Create deployment package
    const deploymentData = {
      customizations,
      timestamp: new Date(),
      userId,
      storeId: req.headers['x-store-id'] || userId,
    };

    // Mock deployment process (replace with actual Render deployment)
    const deploymentResult = await deployToRender(deploymentData);

    res.json({
      success: true,
      deploymentId: deploymentResult.id,
      status: deploymentResult.status,
      url: deploymentResult.url,
    });
  } catch (error) {
    console.error('Error deploying customizations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to deploy customizations',
    });
  }
});

// Get available templates
router.get('/templates', (req, res) => {
  const templates = {
    'homepage-hero': {
      name: 'Homepage Hero Section',
      category: 'Landing',
      description: 'Main hero section for homepage',
      features: ['Custom styling', 'Content editing', 'Layout options', 'Background images'],
    },
    'product-card': {
      name: 'Product Card',
      category: 'Products',
      description: 'Individual product display card',
      features: ['Card styling', 'Price display', 'Button customization', 'Hover effects'],
    },
    'navigation-menu': {
      name: 'Navigation Menu',
      category: 'Layout',
      description: 'Main site navigation',
      features: ['Menu styling', 'Logo options', 'Mobile responsive', 'Dropdown menus'],
    },
    'footer': {
      name: 'Site Footer',
      category: 'Layout',
      description: 'Website footer section',
      features: ['Multi-column layout', 'Social links', 'Company info', 'Newsletter signup'],
    },
    'checkout-form': {
      name: 'Checkout Form',
      category: 'Ecommerce',
      description: 'Customer checkout process',
      features: ['Form styling', 'Progress indicators', 'Payment options', 'Validation'],
    },
    'product-gallery': {
      name: 'Product Image Gallery',
      category: 'Products',
      description: 'Product image showcase',
      features: ['Image zoom', 'Thumbnail navigation', 'Slideshow', 'Mobile gestures'],
    },
  };

  res.json({
    success: true,
    templates,
  });
});

// Helper function to generate customization with AI (mock implementation)
async function generateCustomizationWithAI(template, prompt, currentCustomizations) {
  // This would be replaced with actual Claude API integration
  // For now, return a mock response based on the prompt
  
  const mockResponses = {
    'dark theme': {
      customizations: {
        backgroundColor: '#1a1a1a',
        textColor: '#ffffff',
        customCSS: `
          .component {
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
            color: #ffffff;
            border: 1px solid #333;
          }
        `,
      },
      generatedCode: `// Dark theme customization
export const DarkThemeCustomization = {
  styles: {
    backgroundColor: '#1a1a1a',
    textColor: '#ffffff',
    accentColor: '#3b82f6',
  },
  customCSS: \`
    .component {
      background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
      color: #ffffff;
      border: 1px solid #333;
    }
  \`
};`,
      explanation: 'Generated a dark theme with gradient background and blue accents.'
    },
    'animation': {
      customizations: {
        customCSS: `
          .component {
            transition: transform 0.3s ease;
          }
          .component:hover {
            transform: scale(1.05);
          }
        `,
      },
      generatedCode: `// Animation customization
export const AnimationCustomization = {
  customCSS: \`
    .component {
      transition: transform 0.3s ease;
    }
    .component:hover {
      transform: scale(1.05);
    }
  \`
};`,
      explanation: 'Added hover animation with smooth scaling effect.'
    }
  };

  // Simple prompt matching for demo
  const promptLower = prompt.toLowerCase();
  if (promptLower.includes('dark')) return mockResponses['dark theme'];
  if (promptLower.includes('animation') || promptLower.includes('hover')) return mockResponses['animation'];

  // Default response
  return {
    customizations: {
      backgroundColor: '#f8fafc',
      textColor: '#1e293b',
      customCSS: `
        .component {
          /* AI-generated styles based on: "${prompt}" */
          background-color: #f8fafc;
          color: #1e293b;
          padding: 1rem;
          border-radius: 0.5rem;
        }
      `,
    },
    generatedCode: `// AI-generated customization
export const CustomCustomization = {
  styles: {
    backgroundColor: '#f8fafc',
    textColor: '#1e293b',
  },
  customCSS: \`
    .component {
      /* AI-generated styles based on: "${prompt}" */
      background-color: #f8fafc;
      color: #1e293b;
      padding: 1rem;
      border-radius: 0.5rem;
    }
  \`
};`,
    explanation: `Generated customization based on your request: "${prompt}"`
  };
}

// Helper function to deploy to Render (mock implementation)
async function deployToRender(deploymentData) {
  // This would integrate with Render's API
  // For now, return a mock deployment result
  
  const deploymentId = 'deploy_' + Date.now();
  
  // Mock deployment process
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    id: deploymentId,
    status: 'initiated',
    url: `https://your-store-${deploymentId}.onrender.com`,
    estimatedTime: '3-5 minutes',
  };
}

module.exports = router;