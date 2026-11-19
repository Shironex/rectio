export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      2,
      'always',
      ['repo', 'tokens', 'ui', 'playground', 'registry', 'cli', 'ci', 'docs'],
    ],
    'scope-empty': [2, 'never'],
    'subject-case': [2, 'always', 'lower-case'],
  },
};
