#!/usr/bin/env node

/**
 * Version sync utility
 * Ensures all version references are consistent
 */

const fs = require('fs-extra');
const path = require('path');

async function syncVersions() {
  try {
    // Read main package.json
    const mainPkgPath = path.join(__dirname, '..', 'package.json');
    const mainPkg = await fs.readJSON(mainPkgPath);
    const version = mainPkg.version;

    console.log(`📦 Main version: ${version}`);

    // Read installer package.json
    const installerPkgPath = path.join(__dirname, 'installer', 'package.json');
    const installerPkg = await fs.readJSON(installerPkgPath);

    // Check if versions match
    if (installerPkg.version !== version) {
      console.log(`⚠️  Installer version mismatch: ${installerPkg.version} !== ${version}`);
      console.log('🔄 Syncing installer version...');
      
      installerPkg.version = version;
      await fs.writeJSON(installerPkgPath, installerPkg, { spaces: 2 });
      
      console.log('✅ Installer version synced!');
    } else {
      console.log('✅ All versions in sync!');
    }

    // Display summary
    console.log('\n📋 Version Summary:');
    console.log(`   Main package:      ${version}`);
    console.log(`   Installer package: ${installerPkg.version}`);

  } catch (error) {
    console.error('❌ Error syncing versions:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  syncVersions();
}

module.exports = { syncVersions };
