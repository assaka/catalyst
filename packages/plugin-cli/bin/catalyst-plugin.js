#!/usr/bin/env node

const { program } = require('commander');
const chalk = require('chalk');
const packageJson = require('../package.json');

// Import commands
const createCommand = require('../src/commands/create');
const buildCommand = require('../src/commands/build');
const publishCommand = require('../src/commands/publish');
const validateCommand = require('../src/commands/validate');

// ASCII Art Banner
const banner = `
${chalk.cyan('╔══════════════════════════════════════╗')}
${chalk.cyan('║')}     ${chalk.bold.white('🚀 DainoStore Plugin CLI')}        ${chalk.cyan('║')}
${chalk.cyan('║')}    ${chalk.gray('Create plugins effortlessly')}     ${chalk.cyan('║')}
${chalk.cyan('╚══════════════════════════════════════╝')}
`;

console.log(banner);

program
  .name('daino-plugin')
  .description('CLI tool for creating and managing DainoStore plugins')
  .version(packageJson.version);

// Create command
program
  .command('create <plugin-name>')
  .description('Create a new plugin from template')
  .option('-t, --template <template>', 'Template to use (hello-world, banner, social)', 'hello-world')
  .option('-d, --directory <directory>', 'Output directory', '.')
  .option('--no-install', 'Skip npm install')
  .option('--no-git', 'Skip git initialization')
  .action(createCommand);

// Build command
program
  .command('build')
  .description('Build plugin for production')
  .option('-o, --output <directory>', 'Output directory', 'dist')
  .option('--zip', 'Create ZIP package')
  .action(buildCommand);

// Validate command
program
  .command('validate [plugin-path]')
  .description('Validate plugin structure and manifest')
  .option('--fix', 'Automatically fix common issues')
  .action(validateCommand);

// Publish command
program
  .command('publish')
  .description('Publish plugin to DainoStore marketplace')
  .option('--store-url <url>', 'DainoStore store URL')
  .option('--api-key <key>', 'API key for authentication')
  .action(publishCommand);

// Dev command
program
  .command('dev')
  .description('Start development server with hot reload')
  .option('-p, --port <port>', 'Port to run on', '3001')
  .action((options) => {
    console.log(chalk.blue('🔧 Starting development server...'));
    console.log(chalk.gray(`Port: ${options.port}`));
    // Development server logic would go here
  });

// Init command
program
  .command('init')
  .description('Initialize current directory as a plugin')
  .action(() => {
    console.log(chalk.blue('📦 Initializing plugin in current directory...'));
    // Init logic would go here
  });

// List templates command
program
  .command('templates')
  .description('List available plugin templates')
  .action(() => {
    console.log(chalk.blue('📋 Available Templates:'));
    console.log(chalk.green('  • hello-world') + chalk.gray(' - Simple message display'));
    console.log(chalk.green('  • banner') + chalk.gray(' - Promotional banner'));
    console.log(chalk.green('  • social') + chalk.gray(' - Social media links'));
    console.log(chalk.green('  • analytics') + chalk.gray(' - Analytics integration'));
    console.log(chalk.green('  • custom') + chalk.gray(' - Empty template'));
  });

// Global error handler
program.exitOverride((err) => {
  if (err.code === 'commander.missingArgument') {
    console.log(chalk.red('❌ Missing required argument'));
    console.log(chalk.gray('Use --help for usage information'));
  } else if (err.code === 'commander.unknownCommand') {
    console.log(chalk.red('❌ Unknown command'));
    console.log(chalk.gray('Use --help to see available commands'));
  }
  process.exit(1);
});

// Parse arguments
program.parse();

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
  console.log(chalk.gray('\nExamples:'));
  console.log(chalk.gray('  $ daino-plugin create my-plugin'));
  console.log(chalk.gray('  $ daino-plugin create banner-plugin --template banner'));
  console.log(chalk.gray('  $ daino-plugin validate'));
  console.log(chalk.gray('  $ daino-plugin build --zip'));
}