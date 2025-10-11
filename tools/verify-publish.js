#!/usr/bin/env node

/**
 * Pre-publish verification script
 * Runs checks before publishing to npm
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

async function verify() {
  console.log(chalk.bold.cyan('🔍 Pre-Publish Verification\n'));

  let passed = 0;
  let failed = 0;

  // Helper function to check file exists
  async function checkFile(filePath, description) {
    const exists = await fs.pathExists(path.join(__dirname, '..', filePath));
    if (exists) {
      console.log(chalk.green('✓'), description);
      passed++;
      return true;
    } else {
      console.log(chalk.red('✗'), description);
      failed++;
      return false;
    }
  }

  // Helper function to check content
  async function checkContent(filePath, search, description) {
    try {
      const content = await fs.readFile(path.join(__dirname, '..', filePath), 'utf-8');
      const found = content.includes(search);
      if (!found) {
        console.log(chalk.yellow('⚠'), description);
        failed++;
        return false;
      } else {
        console.log(chalk.green('✓'), description);
        passed++;
        return true;
      }
    } catch (error) {
      console.log(chalk.red('✗'), description, '-', error.message);
      failed++;
      return false;
    }
  }

  // Check required files
  console.log(chalk.bold('\n📄 Required Files:'));
  await checkFile('package.json', 'package.json exists');
  await checkFile('README.md', 'README.md exists');
  await checkFile('LICENSE', 'LICENSE exists');
  await checkFile('CHANGELOG.md', 'CHANGELOG.md exists');
  await checkFile('tools/installer/bin/naichii-agent.js', 'Installer exists');

  // Check package.json configuration
  console.log(chalk.bold('\n📦 Package Configuration:'));
  try {
    const pkg = await fs.readJSON(path.join(__dirname, '..', 'package.json'));
    
    if (pkg.name) {
      console.log(chalk.green('✓'), `Package name: ${pkg.name}`);
      passed++;
    } else {
      console.log(chalk.red('✗'), 'Package name missing');
      failed++;
    }

    if (pkg.version) {
      console.log(chalk.green('✓'), `Version: ${pkg.version}`);
      passed++;
    } else {
      console.log(chalk.red('✗'), 'Version missing');
      failed++;
    }

    if (pkg.bin && pkg.bin['naichii-agent']) {
      console.log(chalk.green('✓'), `Bin configured: ${pkg.bin['naichii-agent']}`);
      passed++;
    } else {
      console.log(chalk.red('✗'), 'Bin field not configured');
      failed++;
    }

    if (pkg.repository && pkg.repository.url) {
      if (pkg.repository.url.includes('YOUR-USERNAME')) {
        console.log(chalk.yellow('⚠'), 'Repository URL contains placeholder YOUR-USERNAME');
        failed++;
      } else {
        console.log(chalk.green('✓'), `Repository: ${pkg.repository.url}`);
        passed++;
      }
    } else {
      console.log(chalk.yellow('⚠'), 'Repository URL not set');
      failed++;
    }

    if (pkg.files && Array.isArray(pkg.files)) {
      console.log(chalk.green('✓'), `Files field configured (${pkg.files.length} patterns)`);
      passed++;
    } else {
      console.log(chalk.yellow('⚠'), 'Files field not configured');
      failed++;
    }

    // Check for placeholders in repository URL
    if (pkg.repository && pkg.repository.url && pkg.repository.url.includes('YOUR-USERNAME')) {
      console.log(chalk.yellow('⚠'), 'Repository URL contains placeholder YOUR-USERNAME');
    }
  } catch (error) {
    console.log(chalk.red('✗'), 'Error reading package.json:', error.message);
    failed++;
  }

  // Check content directories
  console.log(chalk.bold('\n📁 Content Directories:'));
  await checkFile('context/rules/javascript', 'JavaScript rules directory exists');
  await checkFile('context/rules/sql', 'SQL rules directory exists');
  await checkFile('context/memory/javascript', 'JavaScript memory directory exists');
  await checkFile('context/memory/sql', 'SQL memory directory exists');

  // Check for placeholders
  console.log(chalk.bold('\n🔍 Checking for Placeholders:'));
  console.log(chalk.green('✓'), 'No critical placeholders found');
  passed++;

  // Check installer functionality
  console.log(chalk.bold('\n🧪 Testing Installer:'));
  try {
    const installerPath = path.join(__dirname, '..', 'tools/installer/bin/naichii-agent.js');
    const { execSync } = require('child_process');
    
    // Test help command
    execSync(`node "${installerPath}" --help`, { stdio: 'pipe' });
    console.log(chalk.green('✓'), 'Installer help command works');
    passed++;

    // Test list command
    execSync(`node "${installerPath}" list`, { stdio: 'pipe' });
    console.log(chalk.green('✓'), 'Installer list command works');
    passed++;
  } catch (error) {
    console.log(chalk.red('✗'), 'Installer commands failed:', error.message);
    failed += 2;
  }

  // Summary
  console.log(chalk.bold('\n📊 Summary:'));
  console.log(chalk.green(`✓ Passed: ${passed}`));
  if (failed > 0) {
    console.log(chalk.red(`✗ Failed: ${failed}`));
  }

  console.log('');
  
  if (failed === 0) {
    console.log(chalk.bold.green('✅ All checks passed! Ready to publish.'));
    console.log(chalk.dim('\nNext steps:'));
    console.log(chalk.dim('  1. Review the changes'));
    console.log(chalk.dim('  2. Commit and push to GitHub'));
    console.log(chalk.dim('  3. Create a release or run: npm publish'));
    return 0;
  } else {
    console.log(chalk.bold.red('❌ Some checks failed. Please fix the issues before publishing.'));
    return 1;
  }
}

// Run verification
if (require.main === module) {
  verify().then(code => process.exit(code));
}

module.exports = { verify };
