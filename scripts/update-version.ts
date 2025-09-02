#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';

// Read package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Generate version.ts content
const versionContent = `// This file is auto-generated during build
// DO NOT EDIT MANUALLY - Edit package.json instead
export const HYREX_VERSION = '${packageJson.version}';
`;

// Write to version.ts
const versionFilePath = path.join(__dirname, '..', 'version.ts');
fs.writeFileSync(versionFilePath, versionContent);

console.log(`✅ Updated version.ts to version ${packageJson.version}`);