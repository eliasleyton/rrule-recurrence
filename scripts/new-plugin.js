#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PLUGINS_DIR = path.join(__dirname, '..', 'plugins');

function getLatestVersion() {
    const versions = fs.readdirSync(PLUGINS_DIR)
        .filter(dir => /^\d+\.\d+\.\d+$/.test(dir))
        .sort((a, b) => {
            const [aMajor, aMinor, aPatch] = a.split('.').map(Number);
            const [bMajor, bMinor, bPatch] = b.split('.').map(Number);
            return bMajor - aMajor || bMinor - aMinor || bPatch - aPatch;
        });
    
    return versions[0] || '0.0.0';
}

function incrementVersion(version, type) {
    const [major, minor, patch] = version.split('.').map(Number);
    
    switch (type) {
        case 'major':
            return `${major + 1}.0.0`;
        case 'minor':
            return `${major}.${minor + 1}.0`;
        case 'patch':
            return `${major}.${minor}.${patch + 1}`;
        default:
            throw new Error(`Invalid version type: ${type}`);
    }
}

function copyPluginFiles(sourceVersion, targetVersion) {
    const sourceDir = path.join(PLUGINS_DIR, sourceVersion);
    const targetDir = path.join(PLUGINS_DIR, targetVersion);
    
    if (!fs.existsSync(sourceDir)) {
        throw new Error(`Source version ${sourceVersion} does not exist`);
    }
    
    if (fs.existsSync(targetDir)) {
        throw new Error(`Target version ${targetVersion} already exists`);
    }
    
    // Create target directory
    fs.mkdirSync(targetDir, { recursive: true });
    
    // Copy all files
    const files = fs.readdirSync(sourceDir);
    files.forEach(file => {
        const sourceFile = path.join(sourceDir, file);
        const targetFile = path.join(targetDir, file);
        fs.copyFileSync(sourceFile, targetFile);
    });
}

// Main execution
const versionType = process.argv[2];
if (!['major', 'minor', 'patch'].includes(versionType)) {
    console.error('Usage: node new-plugin.js [major|minor|patch]');
    process.exit(1);
}

try {
    const latestVersion = getLatestVersion();
    const newVersion = incrementVersion(latestVersion, versionType);
    
    console.log(`Creating new plugin version: ${newVersion}`);
    copyPluginFiles(latestVersion, newVersion);
    
    console.log(`Successfully created plugin version ${newVersion}`);
} catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
} 