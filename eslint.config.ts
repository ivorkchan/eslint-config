import { createSimplePlugin } from 'eslint-factory'
import { antfu } from './src'

export default antfu(
  {
    vue: {
      a11y: true,
    },
    react: true,
    solid: true,
    svelte: true,
    astro: true,
    nextjs: true,
    typescript: {
      erasableOnly: true,
    },
    formatters: true,
    pnpm: true,
    type: 'lib',
    jsx: {
      a11y: true,
    },
  },
  {
    ignores: [
      'fixtures',
      '_fixtures',
      '**/constants-generated.ts',
    ],
  },
  {
    files: ['src/**/*.ts'],
    rules: {
      'perfectionist/sort-objects': 'error',
    },
  },
  createSimplePlugin({
    name: 'debugging',
    include: ['**/*.mdx'],
    create(context) {
      console.log(context.sourceCode.ast.tokens)
    },
  }),
)
