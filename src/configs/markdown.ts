import type { OptionsComponentExts, OptionsFiles, OptionsOverrides, TypedFlatConfigItem } from '../types'

import { GLOB_MARKDOWN_CODE, GLOB_MARKDOWN_OR_MDX } from '../globs'
import { interopDefault } from '../utils'

/**
 * Load and validate the eslint-plugin-mdx plugin.
 * Implements defensive loading with graceful error handling.
 */
async function loadMDXPlugin(): Promise<any | null> {
  try {
    const mdx = await interopDefault(import('eslint-plugin-mdx'))

    // Validate plugin structure
    if (!mdx?.configs?.flat?.languageOptions?.parser) {
      console.warn('[@antfu/eslint-config] eslint-plugin-mdx structure incompatible, MDX support may be limited')
      return null
    }

    return mdx
  }
  catch {
    console.warn('[@antfu/eslint-config] eslint-plugin-mdx not found or failed to load, MDX support disabled')
    return null
  }
}

export async function markdown(
  options: OptionsFiles & OptionsComponentExts & OptionsOverrides = {},
): Promise<TypedFlatConfigItem[]> {
  const {
    componentExts = [],
    overrides = {},
  } = options

  const mdx = await loadMDXPlugin()

  // If MDX plugin fails to load, return empty config
  if (!mdx) {
    console.warn('[@antfu/eslint-config] Skipping MDX configuration due to plugin loading failure')
    return []
  }

  const mdxParser = mdx.configs.flat.languageOptions!.parser!

  const patchedParser: any = {
    ...mdxParser,
    parse(text: string, options?: any) {
      const result = mdxParser.parseForESLint!(text, options)
      const body = result.ast.body

      function predicate(token: { start: number, end: number }): boolean {
        for (const node of body) {
          if (node.start <= token.start! && node.end >= token.end!)
            return true
        }
        return false
      }

      // `eslint-mdx` produces extra tokens that are not presented in the AST, causing rules like `indent` to fail
      result.ast.tokens = result.ast.tokens.filter(predicate)
      result.ast.comments = result.ast.comments.filter(predicate)

      return result
    },
  }

  patchedParser.parseForESLint = patchedParser.parse

  return [
    {
      files: [GLOB_MARKDOWN_OR_MDX],
      languageOptions: {
        ecmaVersion: 'latest',
        globals: {
          React: false,
        },
        parser: patchedParser,
        parserOptions: {
          ecmaFeatures: {
            jsx: true,
          },
        },
        sourceType: 'module',
      },
      name: 'antfu/markdown-mdx/setup',
      plugins: {
        mdx,
      },
      processor: mdx.createRemarkProcessor({
        lintCodeBlocks: true,
      }),
      rules: {
        'mdx/remark': 'warn',

        // Disable rules that conflict with MDX JSX handling
        'no-undef': 'off',
        'no-unused-expressions': 'off',

        // Disable stylistic rules that cause circular fixes in MDX
        'style/indent': 'off',
        'style/jsx-closing-bracket-location': 'off',
        'style/jsx-closing-tag-location': 'off',
        'style/jsx-indent': 'off',
        'style/jsx-indent-props': 'off',
        'style/jsx-one-expression-per-line': 'off',
        'style/max-statements-per-line': 'off',
      },
    },
    {
      files: [
        GLOB_MARKDOWN_CODE,
        ...componentExts.map(ext => `${GLOB_MARKDOWN_OR_MDX}/**/*.${ext}`),
      ],
      languageOptions: {
        parserOptions: {
          ecmaFeatures: {
            impliedStrict: true,
          },
        },
      },
      name: 'antfu/markdown-mdx/code-blocks',
      rules: {
        'import/newline-after-import': 'off',

        'no-alert': 'off',
        'no-console': 'off',
        'no-labels': 'off',
        'no-lone-blocks': 'off',
        'no-restricted-syntax': 'off',
        'no-undef': 'off',
        'no-unused-expressions': 'off',
        'no-unused-labels': 'off',
        'no-unused-vars': 'off',

        'node/prefer-global/process': 'off',
        'style/comma-dangle': 'off',

        'style/eol-last': 'off',
        'ts/consistent-type-imports': 'off',
        'ts/no-namespace': 'off',
        'ts/no-redeclare': 'off',
        'ts/no-require-imports': 'off',
        'ts/no-unused-vars': 'off',
        'ts/no-use-before-define': 'off',
        'ts/no-var-requires': 'off',

        'unicode-bom': 'off',
        'unused-imports/no-unused-imports': 'off',
        'unused-imports/no-unused-vars': 'off',

        // Type aware rules
        ...{
          'ts/await-thenable': 'off',
          'ts/dot-notation': 'off',
          'ts/no-floating-promises': 'off',
          'ts/no-for-in-array': 'off',
          'ts/no-implied-eval': 'off',
          'ts/no-misused-promises': 'off',
          'ts/no-throw-literal': 'off',
          'ts/no-unnecessary-type-assertion': 'off',
          'ts/no-unsafe-argument': 'off',
          'ts/no-unsafe-assignment': 'off',
          'ts/no-unsafe-call': 'off',
          'ts/no-unsafe-member-access': 'off',
          'ts/no-unsafe-return': 'off',
          'ts/restrict-plus-operands': 'off',
          'ts/restrict-template-expressions': 'off',
          'ts/unbound-method': 'off',
        },

        ...overrides,
      },
    },
  ]
}
