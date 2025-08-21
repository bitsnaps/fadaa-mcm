# Translation Checker

This directory contains testing utilities for the project.

## Translation Checker Script

The `translation-checker.js` script scans the entire frontend codebase to find translation keys used in Vue components and JavaScript files, then compares them with existing locale files to identify missing translations.

### Features

- 🔍 **Comprehensive Scanning**: Scans all `.vue`, `.js`, and `.ts` files in the `src/` directory
- 🌐 **Multi-locale Support**: Checks both English (`en.json`) and French (`fr.json`) locale files
- 📊 **Detailed Analysis**: Identifies missing translations and unused translation keys
- 🎯 **Pattern Recognition**: Detects various translation patterns:
  - `$t('key')` and `t('key')` function calls
  - Template usage: `{{ $t('key') }}` and `{{ t('key') }}`
  - Attribute bindings: `:placeholder="$t('key')"`
  - Vue directives with translations

### Usage

```bash
# Run from the project root directory
node tests/translation-checker.js
```

### Output

The script provides a comprehensive report including:

1. **Summary**: Total translation keys found and locale file statistics
2. **Missing Translations**: Keys used in code but missing from locale files
3. **Unused Translations**: Keys in locale files but not used in code
4. **Recommendations**: Actionable suggestions for improving translations

### Example Output

```
🔍 Translation Checker
================================

📂 Loading locale files...
   ✅ Loaded en.json
   ✅ Loaded fr.json

🔍 Scanning source files for translation keys...
   📄 components/Navbar.vue: 22 keys
   📄 views/Login.vue: 19 keys
   📊 Found 834 unique translation keys

📋 TRANSLATION ANALYSIS REPORT
==============================

📊 SUMMARY:
   • Total translation keys found in code: 834
   • Total keys in en.json: 929
   • Total keys in fr.json: 932

❌ MISSING TRANSLATIONS:
   🔴 Missing in en.json (25 keys):
      - assistantDashboard.expiringContracts.empty
      - documents.notApplicable
      ...

💡 RECOMMENDATIONS:
   1. Add missing translation keys to the respective locale files
   2. Consider using a default fallback value for missing keys
```

### Configuration

The script can be configured by modifying the `CONFIG` object in `translation-checker.js`:

- `srcDir`: Source directory to scan (default: `../src`)
- `localesDir`: Directory containing locale files (default: `../src/locales`)
- `supportedLocales`: Array of locale codes to check (default: `['en', 'fr']`)
- `fileExtensions`: File extensions to scan (default: `['.vue', '.js', '.ts']`)
- `excludeDirs`: Directories to exclude from scanning

### Dependencies

The script uses only Node.js built-in modules:
- `fs` - File system operations
- `path` - Path manipulation
- `url` - URL utilities for ES modules

No additional packages need to be installed.

### Notes

- The script is designed to work with Vue 3 and vue-i18n
- It supports both Composition API (`t()`) and Options API (`$t()`) patterns
- The script uses ES modules syntax and requires Node.js with ES module support
- Translation keys with dynamic content (containing `${` or `{{`) are automatically filtered out
