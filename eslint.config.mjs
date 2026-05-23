import simon from '@antfu/eslint-config'

export default simon({
  rules: {
    'no-console': 'off',
  },
  ignores: ['**/fixtures', 'test'],
}, {
  files: ['p*.mjs'],
  rules: {
    'antfu/no-top-level-await': 'off',
  },
})
