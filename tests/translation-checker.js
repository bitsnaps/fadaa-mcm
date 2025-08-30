#!/usr/bin/env node

/**
 * Translation Checker Script for FADAA-MCM
 *
 * This script scans the frontend codebase to find translation keys used in Vue components
 * and JavaScript files, then compares them with existing locale files to identify missing translations.
 *
 * Usage: node tests/translation-checker.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  srcDir: path.join(__dirname, '../src'),
  localesDir: path.join(__dirname, '../src/locales'),
  supportedLocales: ['en', 'fr'],
  fileExtensions: ['.vue', '.js', '.ts'],
  excludeDirs: ['node_modules', 'dist', '.git'],
  // Regex patterns to find translation keys
  translationPatterns: [
    // $t('key') or $t("key")
    /\$t\s*\(\s*['"`]([^'"`]+)['"`]/g,
    // t('key') or t("key") 
    /(?<![\w$])\bt\s*\(\s*['"`]([^'"`]+)['"`]/g,
    // {{ $t('key') }} or {{ t('key') }}
    /\{\{\s*\$?t\s*\(\s*['"`]([^'"`]+)['"`]/g,
    // :placeholder="$t('key')" or :placeholder="t('key')"
    /:\w+\s*=\s*['"`]\$?t\s*\(\s*['"`]([^'"`]+)['"`]/g,
    // v-bind or : with $t or t
    /(?:v-bind:|:)\w+\s*=\s*['"`].*?\$?t\s*\(\s*['"`]([^'"`]+)['"`]/g
  ]
};

class TranslationChecker {
  constructor() {
    this.foundKeys = new Set();
    this.localeData = {};
    this.missingKeys = {};
    this.unusedKeys = {};
  }

  /**
   * Main execution method
   */
  async run() {
    console.log('🔍 Translation Checker');
    console.log('================================\n');

    try {
      // Load existing locale files
      await this.loadLocaleFiles();
      
      // Scan source files for translation keys
      await this.scanSourceFiles();
      
      // Analyze missing and unused keys
      this.analyzeTranslations();
      
      // Generate report
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Error running translation checker:', error.message);
      process.exit(1);
    }
  }

  /**
   * Load existing locale files
   */
  async loadLocaleFiles() {
    console.log('📂 Loading locale files...');
    
    for (const locale of CONFIG.supportedLocales) {
      const localeFile = path.join(CONFIG.localesDir, `${locale}.json`);
      
      if (fs.existsSync(localeFile)) {
        try {
          const content = fs.readFileSync(localeFile, 'utf8');
          this.localeData[locale] = JSON.parse(content);
          console.log(`   ✅ Loaded ${locale}.json`);
        } catch (error) {
          console.error(`   ❌ Error loading ${locale}.json:`, error.message);
        }
      } else {
        console.warn(`   ⚠️  Locale file ${locale}.json not found`);
        this.localeData[locale] = {};
      }
    }
    console.log();
  }

  /**
   * Recursively scan source files for translation keys
   */
  async scanSourceFiles() {
    console.log('🔍 Scanning source files for translation keys...');
    
    const scanDir = (dirPath) => {
      const items = fs.readdirSync(dirPath);
      
      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          if (!CONFIG.excludeDirs.includes(item)) {
            scanDir(fullPath);
          }
        } else if (stat.isFile()) {
          const ext = path.extname(item);
          if (CONFIG.fileExtensions.includes(ext)) {
            this.scanFile(fullPath);
          }
        }
      }
    };

    scanDir(CONFIG.srcDir);
    console.log(`   📊 Found ${this.foundKeys.size} unique translation keys\n`);
  }

  /**
   * Scan individual file for translation keys
   */
  scanFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const relativePath = path.relative(CONFIG.srcDir, filePath);
      
      let keysInFile = 0;
      
      for (const pattern of CONFIG.translationPatterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          const key = match[1];
          if (key && !key.includes('${') && !key.includes('{{')) {
            this.foundKeys.add(key);
            keysInFile++;
          }
        }
      }
      
      if (keysInFile > 0) {
        console.log(`   📄 ${relativePath}: ${keysInFile} keys`);
      }
    } catch (error) {
      console.error(`   ❌ Error scanning ${filePath}:`, error.message);
    }
  }

  /**
   * Check if a translation key exists in locale data
   */
  hasTranslationKey(localeData, key) {
    const keys = key.split('.');
    let current = localeData;
    
    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        return false;
      }
    }
    
    return current !== undefined && current !== null;
  }

  /**
   * Get all keys from locale data (flattened)
   */
  getFlattenedKeys(obj, prefix = '') {
    const keys = [];
    
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof value === 'object' && value !== null) {
        keys.push(...this.getFlattenedKeys(value, fullKey));
      } else {
        keys.push(fullKey);
      }
    }
    
    return keys;
  }

  /**
   * Analyze translations to find missing and unused keys
   */
  analyzeTranslations() {
    console.log('🔬 Analyzing translations...');
    
    // Find missing keys for each locale
    for (const locale of CONFIG.supportedLocales) {
      this.missingKeys[locale] = [];
      
      for (const key of this.foundKeys) {
        if (!this.hasTranslationKey(this.localeData[locale], key)) {
          this.missingKeys[locale].push(key);
        }
      }
    }
    
    // Find unused keys (keys in locale files but not used in code)
    for (const locale of CONFIG.supportedLocales) {
      const localeKeys = this.getFlattenedKeys(this.localeData[locale]);
      this.unusedKeys[locale] = localeKeys.filter(key => !this.foundKeys.has(key));
    }
    
    console.log('   ✅ Analysis complete\n');
  }

  /**
   * Generate and display the report
   */
  generateReport() {
    console.log('📋 TRANSLATION ANALYSIS REPORT');
    console.log('==============================\n');
    
    // Summary
    console.log('📊 SUMMARY:');
    console.log(`   • Total translation keys found in code: ${this.foundKeys.size}`);
    
    for (const locale of CONFIG.supportedLocales) {
      const totalInLocale = this.getFlattenedKeys(this.localeData[locale]).length;
      console.log(`   • Total keys in ${locale}.json: ${totalInLocale}`);
    }
    console.log();
    
    // Unused translations
    console.log('🗑️  UNUSED TRANSLATIONS:');
    let hasUnused = false;
    
    for (const locale of CONFIG.supportedLocales) {
      if (this.unusedKeys[locale].length > 0) {
        hasUnused = true;
        console.log(`\n   🟡 Unused in ${locale}.json (${this.unusedKeys[locale].length} keys):`);
        this.unusedKeys[locale].sort().forEach(key => {
          console.log(`      - ${key}`);
        });
      }
    }
    
    if (!hasUnused) {
      console.log('   ✅ No unused translations found!');
    }
    console.log();
    
    // Missing translations
    console.log('❌ MISSING TRANSLATIONS:');
    let hasMissing = false;
    
    for (const locale of CONFIG.supportedLocales) {
      if (this.missingKeys[locale].length > 0) {
        hasMissing = true;
        console.log(`\n   🔴 Missing in ${locale}.json (${this.missingKeys[locale].length} keys):`);
        this.missingKeys[locale].sort().forEach(key => {
          console.log(`      - ${key}`);
        });
      }
    }
    
    if (!hasMissing) {
      console.log('   ✅ No missing translations found!');
    }
    console.log();
        
    // Recommendations
    this.generateRecommendations();
  }

  /**
   * Generate recommendations based on analysis
   */
  generateRecommendations() {
    console.log('💡 RECOMMENDATIONS:');
    
    const totalMissing = Object.values(this.missingKeys).reduce((sum, keys) => sum + keys.length, 0);
    const totalUnused = Object.values(this.unusedKeys).reduce((sum, keys) => sum + keys.length, 0);
    
    if (totalMissing > 0) {
      console.log('   1. Add missing translation keys to the respective locale files');
      console.log('   2. Consider using a default fallback value for missing keys');
    }
    
    if (totalUnused > 0) {
      console.log('   3. Review and remove unused translation keys to reduce bundle size');
      console.log('   4. Verify that unused keys are not used in dynamic contexts');
    }
    
    if (totalMissing === 0 && totalUnused === 0) {
      console.log('   🎉 Your translations are perfectly synchronized!');
    }
    
    console.log('\n✨ Translation check complete!');
  }
}

// Run the script
// Run the script if executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const checker = new TranslationChecker();
  checker.run().catch(console.error);
}

export default TranslationChecker;
