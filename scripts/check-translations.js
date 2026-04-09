#!/usr/bin/env node

import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Recursively flattens a nested object into dot-notation keys
 * @param {object} obj - The object to flatten
 * @param {string} prefix - The prefix for nested keys
 * @returns {Set<string>} Set of all unique keys
 */
function flattenKeys(obj, prefix = '') {
  const keys = new Set();
  
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    keys.add(fullKey);
    
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const nestedKeys = flattenKeys(value, fullKey);
      nestedKeys.forEach(k => keys.add(k));
    }
  }
  
  return keys;
}

/**
 * Counts all unique keys in a translation file
 * @param {string} filePath - Path to the translation JSON file
 * @returns {Set<string>} Set of all unique keys
 */
function countKeys(filePath) {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const translations = JSON.parse(content);
    const keys = flattenKeys(translations);
    
    // Check for duplicates using regex on raw content
    const keyRegex = /^\s*"([^"]+)"\s*:/gm;
    const allMatches = [...content.matchAll(keyRegex)].map(m => m[1]);
    
    // Count only leaf keys or keys in the flat object
    // Note: This is an approximation but works well for our standard format
    const duplicateList = allMatches.filter((item, index) => allMatches.indexOf(item) !== index);
    
    return { keys, duplicates: duplicateList };
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    process.exit(1);
  }
}

// Main execution
const localesDir = join(__dirname, '..', 'src', 'locales');
const files = readdirSync(localesDir).filter(f => f.endsWith('.json'));

if (files.length === 0) {
  console.error('No translation files found in src/locales/');
  process.exit(1);
}

console.log('Checking translation parity...\n');

const results = {};
let allKeys = new Set();
let hasErrors = false;

// Count keys in each file
for (const file of files) {
  const filePath = join(localesDir, file);
  const { keys, duplicates } = countKeys(filePath);
  results[file] = { keys, duplicates };
  keys.forEach(k => allKeys.add(k));
  
  if (duplicates.length > 0) {
    hasErrors = true;
    console.error(`❌ ${file}: ${keys.size} keys (${duplicates.length} DUPLICATES FOUND!)`);
    duplicates.forEach(d => console.error(`   - Duplicate key: ${d}`));
  } else {
    console.log(`${file}: ${keys.size} keys`);
  }
}

// Check for missing keys in each file
const expectedKeyCount = allKeys.size;

console.log(`\nExpected unique key count: ${expectedKeyCount}\n`);

for (const [file, data] of Object.entries(results)) {
  const { keys } = data;
  const missingKeys = [...allKeys].filter(k => !keys.has(k));
  
  if (keys.size < expectedKeyCount) {
    hasErrors = true;
    console.error(`❌ ${file} is missing ${missingKeys.length} key(s):`);
    missingKeys.forEach(key => {
      console.error(`   - ${key}`);
    });
    console.error('');
  } else if (!data.duplicates.length) {
    console.log(`✅ ${file}: All keys present and unique`);
  }
}

if (hasErrors) {
  console.error('\n❌ Translation parity check failed!');
  console.error('All translation files must have the same keys and NO duplicates.');
  process.exit(1);
} else {
  console.log('\n✅ All translation files have parity and no duplicates!');
  process.exit(0);
}

