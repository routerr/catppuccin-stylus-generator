#!/usr/bin/env node

/**
 * Generate version.json with commit count from main branch
 * This script runs during the build process to automatically update the version
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
  // Get commit count on main branch (fallback to HEAD if main doesn't exist)
  let commitCount;
  try {
    commitCount = execSync('git rev-list --count main', { encoding: 'utf-8' }).trim();
  } catch (err) {
    // Fallback to HEAD if main branch doesn't exist or is not checked out
    console.warn('Warning: Could not get count from main branch, using HEAD instead');
    commitCount = execSync('git rev-list --count HEAD', { encoding: 'utf-8' }).trim();
  }

  // Get current commit hash (short version)
  const commitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim();

  // Get current branch name
  const branchName = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();

  // Get build timestamp
  const timestamp = new Date().toISOString();

  // Create version object
  const version = {
    version: `0.1.${commitCount}`,
    commitCount: parseInt(commitCount, 10),
    commitHash,
    branchName,
    timestamp,
    buildDate: new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    })
  };

  // Write to public directory (for production builds)
  const publicDir = path.join(__dirname, '..', 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const versionPath = path.join(publicDir, 'version.json');
  fs.writeFileSync(versionPath, JSON.stringify(version, null, 2));

  console.log('✅ Version generated successfully:');
  console.log(`   Version: v${version.version}`);
  console.log(`   Commit: ${commitHash} (${branchName})`);
  console.log(`   Build: ${version.buildDate}`);

} catch (error) {
  console.error('❌ Error generating version:', error.message);

  // Create a fallback version file
  const fallbackVersion = {
    version: '0.1.0',
    commitCount: 0,
    commitHash: 'unknown',
    branchName: 'unknown',
    timestamp: new Date().toISOString(),
    buildDate: new Date().toLocaleString()
  };

  const publicDir = path.join(__dirname, '..', 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const versionPath = path.join(publicDir, 'version.json');
  fs.writeFileSync(versionPath, JSON.stringify(fallbackVersion, null, 2));

  console.log('⚠️  Using fallback version: v0.1.0');
}
