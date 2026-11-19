export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      2,
      'always',
      [
        'repo',
        'tokens',
        'ui',
        'playground',
        'motion',
        'blocks',
        'registry',
        'cli',
        'mcp',
        'ci',
        'docs',
        'site',
        'templates',
      ],
    ],
    'scope-empty': [2, 'never'],
    'subject-case': [2, 'always', 'lower-case'],
  },
};
