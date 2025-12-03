const inquirer = require('inquirer');
const chalk = require('chalk');
const ora = require('ora');
const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');
const validatePackageName = require('validate-npm-package-name');
const mustache = require('mustache');

const templates = require('../templates');

module.exports = async (pluginName, options) => {
  try {
    console.log(chalk.blue(`🚀 Creating plugin: ${chalk.bold(pluginName)}`));

    // Validate plugin name
    const nameValidation = validatePackageName(pluginName);
    if (!nameValidation.validForNewPackages) {
      console.log(chalk.red('❌ Invalid plugin name'));
      nameValidation.errors?.forEach(error => console.log(chalk.red(`   ${error}`)));
      nameValidation.warnings?.forEach(warning => console.log(chalk.yellow(`   ${warning}`)));
      process.exit(1);
    }

    // Set up paths
    const pluginDir = path.join(options.directory, pluginName);
    const templateName = options.template;

    // Check if directory already exists
    if (await fs.pathExists(pluginDir)) {
      const { overwrite } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'overwrite',
          message: `Directory ${pluginName} already exists. Overwrite?`,
          default: false
        }
      ]);

      if (!overwrite) {
        console.log(chalk.yellow('⚠️  Plugin creation cancelled'));
        return;
      }

      await fs.remove(pluginDir);
    }

    // Get template
    const template = templates[templateName];
    if (!template) {
      console.log(chalk.red(`❌ Template "${templateName}" not found`));
      console.log(chalk.gray('Available templates: ' + Object.keys(templates).join(', ')));
      process.exit(1);
    }

    // Interactive prompts for plugin configuration
    console.log(chalk.blue('\n📋 Plugin Configuration'));
    const config = await inquirer.prompt([
      {
        type: 'input',
        name: 'displayName',
        message: 'Plugin display name:',
        default: pluginName.split('-').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ')
      },
      {
        type: 'input',
        name: 'description',
        message: 'Plugin description:',
        default: template.defaultDescription
      },
      {
        type: 'input',
        name: 'author',
        message: 'Author name:',
        default: 'Store Owner'
      },
      {
        type: 'list',
        name: 'category',
        message: 'Plugin category:',
        choices: [
          { name: '🎨 Display - Visual elements and content', value: 'display' },
          { name: '📢 Marketing - Promotions and campaigns', value: 'marketing' },
          { name: '📱 Social - Social media integration', value: 'social' },
          { name: '📊 Analytics - Tracking and reporting', value: 'analytics' },
          { name: '💳 Payment - Payment processing', value: 'payment' },
          { name: '🛠️  Custom - Custom functionality', value: 'custom' }
        ],
        default: template.defaultCategory
      },
      {
        type: 'checkbox',
        name: 'hooks',
        message: 'Where should your plugin appear?',
        choices: [
          { name: '🏠 Homepage Header', value: 'homepage_header', checked: template.defaultHooks.includes('homepage_header') },
          { name: '🏠 Homepage Content', value: 'homepage_content', checked: template.defaultHooks.includes('homepage_content') },
          { name: '🏠 Homepage Footer', value: 'homepage_footer', checked: template.defaultHooks.includes('homepage_footer') },
          { name: '📦 Product Page Header', value: 'product_page_header', checked: template.defaultHooks.includes('product_page_header') },
          { name: '🛒 Cart Sidebar', value: 'cart_sidebar', checked: template.defaultHooks.includes('cart_sidebar') },
          { name: '💳 Checkout Steps', value: 'checkout_steps', checked: template.defaultHooks.includes('checkout_steps') }
        ],
        validate: (answer) => {
          if (answer.length < 1) {
            return 'You must choose at least one hook location.';
          }
          return true;
        }
      }
    ]);

    // Additional template-specific configuration
    let templateConfig = {};
    if (template.prompts) {
      console.log(chalk.blue('\n⚙️  Template Configuration'));
      templateConfig = await inquirer.prompt(template.prompts);
    }

    // Merge all configuration
    const fullConfig = {
      pluginName,
      slug: pluginName,
      ...config,
      ...templateConfig,
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };

    // Create plugin files
    const spinner = ora('Creating plugin files...').start();

    try {
      // Create directory
      await fs.ensureDir(pluginDir);

      // Generate files from template
      const files = template.files;
      
      for (const [fileName, content] of Object.entries(files)) {
        const filePath = path.join(pluginDir, fileName);
        const renderedContent = mustache.render(content, fullConfig);
        
        // Ensure directory exists for nested files
        await fs.ensureDir(path.dirname(filePath));
        await fs.writeFile(filePath, renderedContent);
      }

      spinner.succeed('Plugin files created');

      // Initialize git repository
      if (options.git) {
        const gitSpinner = ora('Initializing git repository...').start();
        try {
          execSync('git init', { cwd: pluginDir, stdio: 'ignore' });
          execSync('git add .', { cwd: pluginDir, stdio: 'ignore' });
          execSync('git commit -m "Initial plugin setup"', { cwd: pluginDir, stdio: 'ignore' });
          gitSpinner.succeed('Git repository initialized');
        } catch (error) {
          gitSpinner.warn('Git initialization skipped (git not available)');
        }
      }

      // Install dependencies
      if (options.install) {
        const installSpinner = ora('Installing dependencies...').start();
        try {
          execSync('npm install', { cwd: pluginDir, stdio: 'ignore' });
          installSpinner.succeed('Dependencies installed');
        } catch (error) {
          installSpinner.warn('Dependency installation failed');
        }
      }

      // Success message
      console.log(chalk.green('\n✅ Plugin created successfully!'));
      console.log(chalk.gray(`\nPlugin location: ${pluginDir}`));
      
      console.log(chalk.blue('\n📋 Next steps:'));
      console.log(chalk.gray(`  1. cd ${pluginName}`));
      console.log(chalk.gray('  2. daino-plugin validate'));
      console.log(chalk.gray('  3. daino-plugin build --zip'));
      console.log(chalk.gray('  4. Upload the ZIP to your DainoStore store'));

      console.log(chalk.blue('\n📁 Plugin structure:'));
      console.log(chalk.gray('  ├── manifest.json    # Plugin configuration'));
      console.log(chalk.gray('  ├── index.js         # Main plugin code'));
      console.log(chalk.gray('  ├── styles.css       # Plugin styles'));
      console.log(chalk.gray('  ├── package.json     # Node.js package info'));
      console.log(chalk.gray('  └── README.md        # Documentation'));

      console.log(chalk.blue('\n🔧 Development commands:'));
      console.log(chalk.gray('  daino-plugin dev         # Start dev server'));
      console.log(chalk.gray('  daino-plugin validate    # Check plugin'));
      console.log(chalk.gray('  daino-plugin build       # Build for production'));

    } catch (error) {
      spinner.fail('Failed to create plugin files');
      throw error;
    }

  } catch (error) {
    console.log(chalk.red('❌ Plugin creation failed:'));
    console.log(chalk.red(`   ${error.message}`));
    process.exit(1);
  }
};