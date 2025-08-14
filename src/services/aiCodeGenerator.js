/**
 * AI Code Generator Service
 * Integrates with Claude API for intelligent code generation and modification
 */

class AICodeGenerator {
  constructor() {
    this.baseURL = '/api/ai';
    this.maxRetries = 3;
    this.retryDelay = 1000;
  }

  /**
   * Generate code modification based on user prompt and selected element
   */
  async generateCodeModification({ 
    selectedElement, 
    prompt, 
    currentCode, 
    context = {} 
  }) {
    try {
      const requestPayload = {
        type: 'code_modification',
        element: selectedElement,
        prompt: prompt.trim(),
        currentCode,
        context: {
          framework: 'react',
          styling: 'tailwindcss',
          components: 'shadcn-ui',
          ...context
        }
      };

      const response = await this.makeRequest('/generate', requestPayload);
      
      return {
        success: true,
        modifiedCode: response.code,
        explanation: response.explanation,
        changes: response.changes,
        suggestions: response.suggestions
      };
    } catch (error) {
      console.error('AI Code Generation Error:', error);
      return {
        success: false,
        error: error.message,
        fallback: this.generateFallbackCode(selectedElement, prompt)
      };
    }
  }

  /**
   * Generate complete component from scratch
   */
  async generateComponent({ 
    componentName, 
    description, 
    requirements = [],
    style = 'modern'
  }) {
    try {
      const requestPayload = {
        type: 'component_generation',
        componentName,
        description,
        requirements,
        style,
        context: {
          framework: 'react',
          styling: 'tailwindcss',
          components: 'shadcn-ui'
        }
      };

      const response = await this.makeRequest('/generate-component', requestPayload);
      
      return {
        success: true,
        code: response.code,
        imports: response.imports,
        props: response.props,
        examples: response.examples
      };
    } catch (error) {
      console.error('Component Generation Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Analyze code and suggest improvements
   */
  async analyzeAndSuggest(code) {
    try {
      const requestPayload = {
        type: 'code_analysis',
        code,
        analysisType: ['performance', 'accessibility', 'best_practices', 'security']
      };

      const response = await this.makeRequest('/analyze', requestPayload);
      
      return {
        success: true,
        suggestions: response.suggestions,
        issues: response.issues,
        improvements: response.improvements,
        score: response.score
      };
    } catch (error) {
      console.error('Code Analysis Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Smart code completion and suggestions
   */
  async getCodeSuggestions({ 
    code, 
    cursorPosition, 
    context = {} 
  }) {
    try {
      const requestPayload = {
        type: 'code_completion',
        code,
        cursorPosition,
        context
      };

      const response = await this.makeRequest('/complete', requestPayload);
      
      return {
        success: true,
        suggestions: response.suggestions,
        completions: response.completions
      };
    } catch (error) {
      console.error('Code Completion Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Convert design description to React component
   */
  async designToCode({ 
    description, 
    designSystem = 'modern',
    responsive = true 
  }) {
    try {
      const requestPayload = {
        type: 'design_to_code',
        description,
        designSystem,
        responsive,
        context: {
          framework: 'react',
          styling: 'tailwindcss',
          components: 'shadcn-ui'
        }
      };

      const response = await this.makeRequest('/design-to-code', requestPayload);
      
      return {
        success: true,
        code: response.code,
        components: response.components,
        assets: response.assets,
        layout: response.layout
      };
    } catch (error) {
      console.error('Design to Code Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Make API request with retry logic
   */
  async makeRequest(endpoint, payload, retryCount = 0) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      if (retryCount < this.maxRetries) {
        await this.delay(this.retryDelay * Math.pow(2, retryCount));
        return this.makeRequest(endpoint, payload, retryCount + 1);
      }
      throw error;
    }
  }

  /**
   * Generate fallback code when AI service is unavailable
   */
  generateFallbackCode(selectedElement, prompt) {
    const fallbacks = {
      'Button': `<Button className="updated-button">
        {/* Modified based on: ${prompt} */}
        Updated Button
      </Button>`,
      'Card': `<Card className="updated-card">
        {/* Modified based on: ${prompt} */}
        <CardContent>Updated Content</CardContent>
      </Card>`,
      'Input': `<Input 
        className="updated-input"
        placeholder="Updated based on: ${prompt}"
      />`,
      'default': `<!-- Modified based on: ${prompt} -->`
    };

    return fallbacks[selectedElement?.type] || fallbacks.default;
  }

  /**
   * Get authentication token
   */
  getAuthToken() {
    return localStorage.getItem('store_owner_auth_token') || 
           localStorage.getItem('auth_token') || 
           '';
  }

  /**
   * Utility delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Validate code syntax and structure
   */
  validateCode(code) {
    try {
      // Basic React/JSX validation
      const hasImports = code.includes('import');
      const hasExport = code.includes('export') || code.includes('module.exports');
      const hasComponent = code.includes('function') || code.includes('const') || code.includes('class');
      
      return {
        valid: hasImports && hasExport && hasComponent,
        warnings: [],
        errors: []
      };
    } catch (error) {
      return {
        valid: false,
        errors: [error.message]
      };
    }
  }

  /**
   * Format code with prettier-like formatting
   */
  formatCode(code) {
    try {
      // Basic code formatting
      return code
        .replace(/\s+/g, ' ')
        .replace(/;\s*}/g, ';\n}')
        .replace(/{\s*/g, '{\n  ')
        .replace(/}\s*/g, '\n}')
        .trim();
    } catch (error) {
      console.error('Code formatting error:', error);
      return code;
    }
  }
}

export default new AICodeGenerator();