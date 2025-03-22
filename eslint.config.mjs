import simon from '@antfu/eslint-config'

export default simon({
  rules: {
    'no-console': 'off',
  },
  ignores: ['**/fixtures', 'test'],
})
