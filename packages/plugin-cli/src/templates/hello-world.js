module.exports = {
  defaultDescription: 'A simple plugin that displays a customizable message',
  defaultCategory: 'display',
  defaultHooks: ['homepage_header'],
  
  prompts: [
    {
      type: 'input',
      name: 'defaultMessage',
      message: 'Default message to display:',
      default: 'Hello World!'
    },
    {
      type: 'input',
      name: 'backgroundColor',
      message: 'Default background color:',
      default: '#f0f8ff'
    },
    {
      type: 'input',
      name: 'textColor',
      message: 'Default text color:',
      default: '#333333'
    }
  ],

  files: {
    'manifest.json': `{
  "name": "{{displayName}}",
  "slug": "{{slug}}",
  "version": "{{version}}",
  "description": "{{description}}",
  "author": "{{author}}",
  "category": "{{category}}",
  "compatibility": {
    "minVersion": "1.0.0",
    "maxVersion": "2.0.0"
  },
  "hooks": {
{{#hooks}}
    "{{.}}": "render{{#lambda.titleCase}}{{.}}{{/lambda.titleCase}}"{{#lambda.notLast}},{{/lambda.notLast}}
{{/hooks}}
  },
  "configSchema": {
    "properties": {
      "message": {
        "type": "string",
        "default": "{{defaultMessage}}",
        "description": "The message to display"
      },
      "backgroundColor": {
        "type": "string",
        "default": "{{backgroundColor}}",
        "description": "Background color for the message box"
      },
      "textColor": {
        "type": "string",
        "default": "{{textColor}}",
        "description": "Text color for the message"
      },
      "enabled": {
        "type": "boolean",
        "default": true,
        "description": "Enable or disable the message display"
      }
    }
  },
  "permissions": [
    "read:homepage"
  ]
}`,

    'index.js': `/**
 * {{displayName}}
 * {{description}}
 * 
 * @author {{author}}
 * @version {{version}}
 */

class {{#lambda.pascalCase}}{{slug}}{{/lambda.pascalCase}}Plugin {
  constructor() {
    this.name = '{{displayName}}';
    this.version = '{{version}}';
  }

{{#hooks}}
  /**
   * Render content for {{.}} hook
   * @param {Object} config - Plugin configuration
   * @param {Object} context - Rendering context (store, user, etc.)
   * @returns {string} HTML content
   */
  render{{#lambda.titleCase}}{{.}}{{/lambda.titleCase}}(config, context) {
    // Check if plugin is enabled
    if (!config.enabled) {
      return '';
    }

    const {
      message = '{{defaultMessage}}',
      backgroundColor = '{{backgroundColor}}',
      textColor = '{{textColor}}'
    } = config;

    return \`
      <div class="{{slug}}-container" style="
        background-color: \${backgroundColor};
        color: \${textColor};
        padding: 20px;
        text-align: center;
        border-radius: 8px;
        margin: 15px 0;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      ">
        <h3 style="margin: 0 0 10px 0; font-size: 1.5em;">
          \${message}
        </h3>
        <p style="margin: 0; opacity: 0.8;">
          Welcome to \${context.store.name}!
        </p>
      </div>
    \`;
  }
{{/hooks}}
}

module.exports = {{#lambda.pascalCase}}{{slug}}{{/lambda.pascalCase}}Plugin;`,

    'styles.css': `/* {{displayName}} Styles */
.{{slug}}-container {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  transition: all 0.3s ease;
}

.{{slug}}-container:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15) !important;
}

.{{slug}}-container h3 {
  font-weight: 600;
  letter-spacing: -0.025em;
}

.{{slug}}-container p {
  font-size: 0.9em;
  line-height: 1.4;
}

/* Responsive design */
@media (max-width: 768px) {
  .{{slug}}-container {
    margin: 10px 0;
    padding: 15px;
  }
  
  .{{slug}}-container h3 {
    font-size: 1.3em;
  }
}`,

    'package.json': `{
  "name": "{{slug}}",
  "version": "{{version}}",
  "description": "{{description}}",
  "main": "index.js",
  "scripts": {
    "test": "echo \\"No tests specified\\" && exit 0",
    "build": "daino-plugin build",
    "validate": "daino-plugin validate"
  },
  "keywords": [
    "daino",
    "plugin",
    "{{category}}"
  ],
  "author": "{{author}}",
  "license": "MIT",
  "daino": {
    "pluginType": "display",
    "hooks": [{{#hooks}}"{{.}}"{{#lambda.notLast}}, {{/lambda.notLast}}{{/hooks}}]
  }
}`,

    'README.md': `# {{displayName}}

{{description}}

## Features

- ✨ Customizable message text
- 🎨 Custom colors and styling
- 📱 Responsive design
- ⚡ Lightweight and fast
- 🔧 Easy configuration

## Configuration

This plugin supports the following configuration options:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| \`message\` | string | "{{defaultMessage}}" | The message to display |
| \`backgroundColor\` | string | "{{backgroundColor}}" | Background color for the message box |
| \`textColor\` | string | "{{textColor}}" | Text color for the message |
| \`enabled\` | boolean | true | Enable or disable the message display |

## Installation

### Via DainoStore Admin Panel

1. Go to **Admin** → **Plugins** → **Create New Plugin**
2. Choose **Upload ZIP** method
3. Upload the built plugin ZIP file
4. Configure the plugin settings
5. Enable for your store

### Via CLI

\`\`\`bash
# Build the plugin
npm run build

# Validate the plugin
npm run validate
\`\`\`

## Development

\`\`\`bash
# Install dependencies
npm install

# Start development server
daino-plugin dev

# Build for production
daino-plugin build --zip
\`\`\`

## Hooks

This plugin uses the following hooks:

{{#hooks}}
- \`{{.}}\` - {{#lambda.hookDescription}}{{.}}{{/lambda.hookDescription}}
{{/hooks}}

## Author

Created by {{author}}

## License

MIT License - feel free to customize and redistribute!
`,

    '.gitignore': `# Dependencies
node_modules/
npm-debug.log*

# Build output
dist/
*.zip

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# IDE files
.vscode/
.idea/
*.swp
*.swo

# Logs
logs/
*.log

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local`
  }
};