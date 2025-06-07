module.exports = {
  "env": {
    "browser": true,
    "es2021": true,
    "node": true,
    "jest": true,
    "jest/globals": true
  },
  "extends": [
    "eslint:recommended",
    "plugin:jest/recommended"
  ],
  "parserOptions": {
    "ecmaVersion": 12,
    "sourceType": "module"
  },
  "plugins": [
    "jest"
  ],
  "globals": {
    "chrome": "readonly",
    "global": "writable"
  },
  "rules": {
    "no-console": "off",
    "jest/no-conditional-expect": "error",
    "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }]
  }
};
