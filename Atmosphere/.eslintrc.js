module.exports = {
  root: true,
  extends: ['@react-native', 'plugin:@typescript-eslint/recommended'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  rules: {
    'react-native/no-inline-styles': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { 'argsIgnorePattern': '^_', 'varsIgnorePattern': '^_' }],
  },
};
module.exports = {
  root: true,
  extends: '@react-native',
};
