/**
 * AI Enhancement Service
 *
 * Provides AI-powered analysis and customization capabilities for the slot editors.
 * Handles screenshot analysis, style generation, and AI-assisted customization.
 *
 * Features:
 * - Screenshot analysis to understand design intent
 * - Automatic style generation based on visual references
 * - Context-aware suggestions for layout improvements
 * - Integration with various AI providers (OpenAI, Claude, etc.)
 */

class AIEnhancementService {
  constructor() {
    this.apiKey = process.env.REACT_APP_OPENAI_API_KEY || process.env.REACT_APP_ANTHROPIC_API_KEY;
    this.provider = process.env.REACT_APP_AI_PROVIDER || 'openai'; // 'openai' or 'anthropic'
    this.baseUrl = this.getBaseUrl();
  }

  getBaseUrl() {
    switch (this.provider) {
      case 'anthropic':
        return 'https://api.anthropic.com/v1';
      case 'openai':
      default:
        return 'https://api.openai.com/v1';
    }
  }

  /**
   * Analyze a screenshot to understand design intent and layout
   *
   * @param {File} imageFile - The screenshot file
   * @param {Object} currentLayout - Current slot configuration
   * @param {string} pageType - Type of page (product, cart, category)
   * @param {Object} context - Page context data
   * @returns {Promise<Object>} Analysis results with suggestions
   */
  async analyzeScreenshot(imageFile, currentLayout, pageType, context) {
    try {
      // Convert image to base64
      const base64Image = await this.fileToBase64(imageFile);

      // Prepare the analysis prompt based on page type
      const prompt = this.generateAnalysisPrompt(pageType, currentLayout, context);

      // Call AI service for analysis
      const analysis = await this.callVisionAPI(base64Image, prompt);

      return {
        summary: analysis.summary,
        suggestions: analysis.suggestions,
        detectedElements: analysis.detectedElements,
        styleRecommendations: analysis.styleRecommendations,
        confidence: analysis.confidence,
        analysisId: Date.now()
      };
    } catch (error) {
      console.error('Screenshot analysis failed:', error);
      throw new Error('Failed to analyze screenshot');
    }
  }

  /**
   * Generate styles based on analysis results
   *
   * @param {Object} analysis - Results from screenshot analysis
   * @param {Object} currentLayout - Current slot configuration
   * @param {string} pageType - Type of page
   * @returns {Promise<Object>} Generated styles and layout modifications
   */
  async generateStyles(analysis, currentLayout, pageType) {
    try {
      const prompt = this.generateStylePrompt(analysis, currentLayout, pageType);

      const styleGeneration = await this.callTextAPI(prompt);

      // Parse the generated styles into slot configurations
      const updatedSlots = this.parseGeneratedStyles(styleGeneration, currentLayout);

      return {
        slots: updatedSlots,
        globalStyles: styleGeneration.globalStyles || {},
        metadata: {
          aiGenerated: true,
          analysisId: analysis.analysisId,
          confidence: analysis.confidence,
          timestamp: Date.now()
        }
      };
    } catch (error) {
      console.error('Style generation failed:', error);
      throw new Error('Failed to generate styles');
    }
  }

  /**
   * Get contextual suggestions for layout improvements
   *
   * @param {Object} currentLayout - Current slot configuration
   * @param {string} pageType - Type of page
   * @param {Object} context - Page context data
   * @returns {Promise<Array>} Array of improvement suggestions
   */
  async getSuggestions(currentLayout, pageType, context) {
    try {
      const prompt = this.generateSuggestionsPrompt(currentLayout, pageType, context);

      const response = await this.callTextAPI(prompt);

      return response.suggestions || [];
    } catch (error) {
      console.error('Failed to get suggestions:', error);
      return [];
    }
  }

  /**
   * Apply AI-generated styles to current layout
   *
   * @param {Object} generatedStyles - Styles from AI generation
   * @param {Object} currentLayout - Current layout configuration
   * @returns {Object} Updated layout configuration
   */
  applyGeneratedStyles(generatedStyles, currentLayout) {
    const updatedLayout = { ...currentLayout };

    // Apply slot-specific styles
    if (generatedStyles.slots) {
      updatedLayout.slots = {
        ...updatedLayout.slots,
        ...generatedStyles.slots
      };
    }

    // Apply global styles if any
    if (generatedStyles.globalStyles) {
      updatedLayout.globalStyles = {
        ...updatedLayout.globalStyles,
        ...generatedStyles.globalStyles
      };
    }

    // Update metadata
    updatedLayout.metadata = {
      ...updatedLayout.metadata,
      ...generatedStyles.metadata,
      lastModified: new Date().toISOString()
    };

    return updatedLayout;
  }

  // Private helper methods

  async fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  generateAnalysisPrompt(pageType, currentLayout, context) {
    const basePrompt = `Analyze this ${pageType} page screenshot and provide detailed insights about the design and layout.

Current page configuration:
- Page type: ${pageType}
- Existing slots: ${Object.keys(currentLayout.slots || {}).length}
- View mode: ${context?.viewMode || 'default'}

Please analyze:
1. Overall layout structure and visual hierarchy
2. Color scheme and typography
3. Component positioning and spacing
4. User interface patterns and design elements
5. Areas for improvement based on UX best practices

Provide specific, actionable recommendations for recreating this design using our slot system.`;

    // Add page-specific context
    switch (pageType) {
      case 'product':
        return basePrompt + `\n\nProduct page specific analysis:
- Product image gallery layout and style
- Product information presentation
- Add to cart button design and placement
- Reviews and ratings display
- Related products section`;

      case 'cart':
        return basePrompt + `\n\nShopping cart specific analysis:
- Cart items layout and styling
- Order summary design
- Checkout flow and buttons
- Empty cart state design
- Coupon/discount code section`;

      case 'category':
        return basePrompt + `\n\nCategory page specific analysis:
- Product grid/list layout
- Filter sidebar design and functionality
- Search and sorting controls
- Pagination styling
- Category header and breadcrumbs`;

      default:
        return basePrompt;
    }
  }

  generateStylePrompt(analysis, currentLayout, pageType) {
    return `Based on the screenshot analysis, generate specific CSS classes and styling for a ${pageType} page.

Analysis results:
${JSON.stringify(analysis, null, 2)}

Current layout structure:
${JSON.stringify(Object.keys(currentLayout.slots || {}), null, 2)}

Generate styling that includes:
1. Tailwind CSS classes for each relevant slot
2. Color schemes and typography adjustments
3. Spacing and layout modifications
4. Responsive design considerations
5. Hover and interaction states

Format the response as a JSON object with slot IDs as keys and their updated configurations as values.`;
  }

  generateSuggestionsPrompt(currentLayout, pageType, context) {
    return `Analyze this ${pageType} page layout and provide improvement suggestions.

Current configuration:
${JSON.stringify(currentLayout, null, 2)}

Context:
${JSON.stringify(context, null, 2)}

Provide 3-5 specific suggestions for:
1. UX improvements
2. Design enhancements
3. Performance optimizations
4. Accessibility improvements
5. Conversion rate optimization

Format as an array of suggestion objects with title, description, and priority.`;
  }

  async callVisionAPI(base64Image, prompt) {
    if (this.provider === 'anthropic') {
      return this.callAnthropicVision(base64Image, prompt);
    } else {
      return this.callOpenAIVision(base64Image, prompt);
    }
  }

  async callTextAPI(prompt) {
    if (this.provider === 'anthropic') {
      return this.callAnthropicText(prompt);
    } else {
      return this.callOpenAIText(prompt);
    }
  }

  async callOpenAIVision(base64Image, prompt) {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: base64Image } }
            ]
          }
        ],
        max_tokens: 1000
      })
    });

    const data = await response.json();
    return this.parseOpenAIResponse(data);
  }

  async callOpenAIText(prompt) {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1500
      })
    });

    const data = await response.json();
    return this.parseOpenAIResponse(data);
  }

  async callAnthropicVision(base64Image, prompt) {
    // Note: Anthropic's Claude doesn't support vision yet in the same way
    // This is a placeholder for when the feature becomes available
    console.warn('Anthropic vision API not yet implemented');
    return this.getMockAnalysisResponse();
  }

  async callAnthropicText(prompt) {
    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1500
      })
    });

    const data = await response.json();
    return this.parseAnthropicResponse(data);
  }

  parseOpenAIResponse(data) {
    if (data.error) {
      throw new Error(data.error.message);
    }

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    try {
      return JSON.parse(content);
    } catch {
      return { summary: content, confidence: 0.7 };
    }
  }

  parseAnthropicResponse(data) {
    if (data.error) {
      throw new Error(data.error.message);
    }

    const content = data.content?.[0]?.text;
    if (!content) {
      throw new Error('No response from Anthropic');
    }

    try {
      return JSON.parse(content);
    } catch {
      return { summary: content, confidence: 0.7 };
    }
  }

  parseGeneratedStyles(styleGeneration, currentLayout) {
    const updatedSlots = { ...currentLayout.slots };

    // Apply generated styles to existing slots
    if (styleGeneration.slots) {
      Object.keys(styleGeneration.slots).forEach(slotId => {
        if (updatedSlots[slotId]) {
          updatedSlots[slotId] = {
            ...updatedSlots[slotId],
            ...styleGeneration.slots[slotId]
          };
        }
      });
    }

    return updatedSlots;
  }

  getMockAnalysisResponse() {
    // Fallback mock response for development/testing
    return {
      summary: "Detected a well-structured e-commerce page with clear visual hierarchy",
      suggestions: [
        "Improve spacing between product cards",
        "Enhance call-to-action button visibility",
        "Add more visual emphasis to pricing information"
      ],
      detectedElements: [
        "product_grid",
        "navigation_header",
        "filter_sidebar",
        "footer"
      ],
      styleRecommendations: {
        colorScheme: "modern",
        typography: "clean",
        spacing: "generous"
      },
      confidence: 0.75
    };
  }
}

// Export singleton instance
const aiEnhancementService = new AIEnhancementService();
export default aiEnhancementService;