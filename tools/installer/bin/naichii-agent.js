#!/usr/bin/env node

const { program } = require('commander');
const path = require('node:path');
const fs = require('fs-extra');
const chalk = require('chalk');
const inquirer = require('inquirer');

// Handle both execution contexts (from root via npx or from installer directory)
let version;
let packageName;
try {
  // Try installer context first
  version = require('../package.json').version;
  packageName = require('../package.json').name;
} catch (error) {
  // Fall back to root context
  try {
    version = require('../../../package.json').version;
    packageName = require('../../../package.json').name;
  } catch (error) {
    console.error('Error: Could not load package.json');
    process.exit(1);
  }
}

program
  .version(version)
  .description('AI Agent Framework installer - Context, rules, and memory management');

program
  .command('install')
  .description('Install AI Agent Framework in your project')
  .option('-d, --directory <path>', 'Installation directory', '.')
  .action(async (options) => {
    try {
      await installFramework(options);
    } catch (error) {
      console.error(chalk.red('Installation failed:'), error.message);
      process.exit(1);
    }
  });

program
  .command('list')
  .description('List available rules and contexts')
  .action(async () => {
    try {
      await listAvailable();
    } catch (error) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

async function installFramework(options) {
  console.log(chalk.bold.cyan(`
╔═══════════════════════════════════════╗
║     AI AGENT FRAMEWORK INSTALLER      ║
╚═══════════════════════════════════════╝
  `));
  
  console.log(chalk.bold.blue(`✨ Installer v${version}\n`));

  // Resolve installation directory
  const originalCwd = process.env.INIT_CWD || process.env.PWD || process.cwd();
  const installDir = path.isAbsolute(options.directory)
    ? options.directory
    : path.resolve(originalCwd, options.directory);

  console.log(chalk.cyan(`📂 Installation directory: ${installDir}\n`));

  // Check if directory exists
  const dirExists = await fs.pathExists(installDir);
  if (!dirExists) {
    const { createDir } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'createDir',
        message: `Directory ${installDir} does not exist. Create it?`,
        default: true,
      }
    ]);

    if (!createDir) {
      console.log(chalk.yellow('Installation cancelled.'));
      return;
    }

    await fs.ensureDir(installDir);
  }

  // Ask what to install
  const { components } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'components',
      message: 'Select components to install:',
      choices: [
        { name: 'JavaScript Rules & Guidelines', value: 'javascript', checked: true },
        { name: 'SQL Rules & Guidelines', value: 'sql', checked: true },
        { name: 'JavaScript Memory Context', value: 'js-memory', checked: true },
        { name: 'SQL Memory Context', value: 'sql-memory', checked: true },
      ],
      validate: (selected) => {
        if (selected.length === 0) {
          return 'Please select at least one component';
        }
        return true;
      },
    }
  ]);

  console.log(chalk.cyan('\n📦 Installing selected components...\n'));

  // Get source directory (where this script is located)
  const sourceDir = path.join(__dirname, '..', '..', '..');

  // Install JavaScript components
  if (components.includes('javascript')) {
    await copyDirectory(
      path.join(sourceDir, 'context', 'rules', 'javascript'),
      path.join(installDir, '.naichii-agent', 'rules', 'javascript'),
      'JavaScript Rules'
    );
  }

  if (components.includes('js-memory')) {
    await copyDirectory(
      path.join(sourceDir, 'context', 'memory', 'javascript'),
      path.join(installDir, '.naichii-agent', 'memory', 'javascript'),
      'JavaScript Memory'
    );
  }

  // Install SQL components
  if (components.includes('sql')) {
    await copyDirectory(
      path.join(sourceDir, 'context', 'rules', 'sql'),
      path.join(installDir, '.naichii-agent', 'rules', 'sql'),
      'SQL Rules'
    );
  }

  if (components.includes('sql-memory')) {
    await copyDirectory(
      path.join(sourceDir, 'context', 'memory', 'sql'),
      path.join(installDir, '.naichii-agent', 'memory', 'sql'),
      'SQL Memory'
    );
  }

  // Create instructions reference file
  const instructionsContent = `# AI Agent Framework

This project uses the AI Agent Framework for maintaining code quality and consistency.

## Installed Components

${components.includes('javascript') ? '- JavaScript Rules & Guidelines (`.naichii-agent/rules/javascript/`)' : ''}
${components.includes('sql') ? '- SQL Rules & Guidelines (`.naichii-agent/rules/sql/`)' : ''}
${components.includes('js-memory') ? '- JavaScript Memory Context (`.naichii-agent/memory/javascript/`)' : ''}
${components.includes('sql-memory') ? '- SQL Memory Context (`.naichii-agent/memory/sql/`)' : ''}

## Structure

\`\`\`
.naichii-agent/
├── rules/           # Coding guidelines and best practices
│   ├── javascript/  # JavaScript-specific rules
│   └── sql/         # SQL-specific rules
└── memory/          # Context and memory for AI agents
    ├── javascript/  # JavaScript context
    └── sql/         # SQL context
\`\`\`

## Usage

The AI agent will automatically reference these files when working on your project.
You can also reference them manually when needed.

## Updating

To update the framework, run:
\`\`\`bash
npx naichii-agent install
\`\`\`
`;

  await fs.writeFile(
    path.join(installDir, '.naichii-agent', 'README.md'),
    instructionsContent
  );

  console.log(chalk.green('✓ Created README.md'));

  // Update .gitignore if it exists
  const gitignorePath = path.join(installDir, '.gitignore');
  if (await fs.pathExists(gitignorePath)) {
    let gitignore = await fs.readFile(gitignorePath, 'utf-8');
    if (!gitignore.includes('.naichii-agent')) {
      gitignore += '\n# Naichii Agent Framework\n# Uncomment if you don\'t want to commit the framework\n# .naichii-agent/\n';
      await fs.writeFile(gitignorePath, gitignore);
      console.log(chalk.green('✓ Updated .gitignore'));
    }
  }

  console.log(chalk.green('\n✅ Installation complete!\n'));
  console.log(chalk.cyan('📝 Framework installed in:'), chalk.bold(path.join(installDir, '.naichii-agent')));
  console.log(chalk.cyan('📖 Read the README:'), chalk.bold(path.join(installDir, '.naichii-agent', 'README.md')));
}

async function copyDirectory(source, destination, label) {
  try {
    await fs.ensureDir(destination);
    await fs.copy(source, destination, { overwrite: true });
    console.log(chalk.green(`✓ Installed ${label}`));
    return true;
  } catch (error) {
    console.log(chalk.yellow(`⚠ Could not install ${label}: ${error.message}`));
    return false;
  }
}

async function listAvailable() {
  console.log(chalk.bold.cyan('\n📚 Available Components:\n'));

  console.log(chalk.bold('JavaScript:'));
  console.log(chalk.dim('  Rules:'));
  console.log('    - basics.md        - Core JavaScript syntax and patterns');
  console.log('    - async.md         - Asynchronous programming');
  console.log('    - security.md      - Security best practices');
  console.log('    - testing.md       - Testing guidelines');
  console.log('    - optimization.md  - Performance optimization');
  console.log('    - advanced.md      - Advanced patterns');
  console.log(chalk.dim('  Memory:'));
  console.log('    - js-memory.md     - JavaScript context and patterns\n');

  console.log(chalk.bold('SQL:'));
  console.log(chalk.dim('  Rules:'));
  console.log('    - basics.md              - SQL fundamentals');
  console.log('    - security.md            - SQL security practices');
  console.log('    - optimization.md        - Query optimization');
  console.log('    - advanced.md            - Advanced SQL features');
  console.log('    - stored-procedures.md   - Stored procedure guidelines');
  console.log(chalk.dim('  Memory:'));
  console.log('    - sql-memory.md          - SQL context and patterns\n');

  console.log(chalk.dim('Install with:'), chalk.cyan('npx naichii-agent install\n'));
}

program.parse(process.argv);

// Show help if no command provided
if (process.argv.slice(2).length === 0) {
  program.outputHelp();
}
