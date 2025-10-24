# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is `@antfu/eslint-config` - Anthony Fu's opinionated ESLint configuration package that provides a comprehensive, composable ESLint setup using the new flat config format. It's designed to work standalone without Prettier and supports TypeScript, Vue, React, Svelte, Astro, and many other frameworks out of the box.

Key characteristics:

- Uses ESLint Flat Config format (requires ESLint v9.5.0+)
- Auto-detects project features (TypeScript, Vue, etc.) based on dependencies
- Includes formatters for non-JS files (CSS, HTML, Markdown, etc.)
- Highly composable architecture with plugin-specific configs
- Includes a CLI wizard for project setup
- Style: single quotes, no semi, sorted imports, dangling commas

## Development Commands

### Build & Development

```bash
pnpm build         # Build the package (runs typegen, versiongen, and tsdown with --dts)
pnpm stub          # Build in stub mode for development
pnpm watch         # Watch mode for continuous building
pnpm dev           # Run ESLint config inspector UI
```

### Testing

```bash
pnpm test          # Run all tests with Vitest
pnpm typecheck     # Run TypeScript type checking (no emit)
```

### Linting

```bash
pnpm lint          # Lint the codebase (uses this config on itself)
```

### Code Generation

```bash
pnpm gen           # Run both typegen and versiongen scripts
```

### Release

```bash
pnpm release       # Release a new version (uses bumpp)
```

### Pre-commit

The project uses `simple-git-hooks` with `lint-staged` to auto-fix files on commit.

## Architecture

### Core Structure

The config system is built around a factory pattern centered in `src/factory.ts`:

1. **Factory Function (`antfu()`)**: Main entry point that composes all configs. Returns a `FlatConfigComposer` object for further chaining/customization.

2. **Config Modules**: Each integration lives in `src/configs/` as a separate module:
   - Base: `javascript.ts`, `typescript.ts`, `jsx.ts`, `node.ts`, `imports.ts`
   - Frameworks: `vue.ts`, `react.ts`, `svelte.ts`, `astro.ts`, `solid.ts`, `nextjs.ts`
   - Data formats: `jsonc.ts`, `yaml.ts`, `toml.ts`, `markdown.ts`
   - Utilities: `stylistic.ts`, `formatters.ts`, `test.ts`, `regexp.ts`, `unicorn.ts`
   - Special: `command.ts` (micro-codemod tool), `perfectionist.ts` (sorting)

3. **Type System**:
   - `src/types.ts`: TypeScript interfaces for all options
   - `src/typegen.d.ts`: Auto-generated type definitions from typegen script
   - Each config option can be `boolean` or object with `overrides`

4. **Glob Patterns**: `src/globs.ts` defines all file matching patterns used throughout configs

5. **Plugin Renaming**: The config renames plugin prefixes for better DX (e.g., `@typescript-eslint/*` → `ts/*`, `import-lite/*` → `import/*`). Mapping in `defaultPluginRenaming`.

### How Configs are Composed

1. Options are passed to `antfu()` function
2. Factory detects enabled features (auto-detects TypeScript/Vue based on deps)
3. Configs are built as async arrays and pushed to `configs` array
4. All configs are composed using `FlatConfigComposer` from `eslint-flat-config-utils`
5. Plugin renaming is applied if `autoRenamePlugins` is true (default)
6. Editor-specific rule disables are applied if `isInEditor` is detected
7. Returns composer for further chaining (`.override()`, `.prepend()`, `.renamePlugins()`, etc.)

### Config Resolution Logic

- Most integrations support three forms:
  - `false`: disabled
  - `true`: enabled with defaults
  - `object`: enabled with custom options including `overrides` for rules
- The `resolveSubOptions()` and `getOverrides()` helpers extract options and overrides consistently
- Type-aware TypeScript rules require `tsconfigPath` option

### CLI Wizard

Located in `src/cli/`:

- `run.ts`: Main wizard logic with prompts
- Stages: update eslint config, package.json, VS Code settings
- Helps migrate from legacy config or set up new projects

## Testing Strategy

Tests are in `test/fixtures.test.ts`:

- Snapshot-based testing using Vitest's file snapshots
- Copies fixtures from `fixtures/input/` to `_fixtures/`
- Runs ESLint with different config combinations
- Compares output with snapshots in `fixtures/output/{config-name}/`
- Each test runs with different config options to validate various setups
- Tests run concurrently with 60s timeout (300s on Windows)

To add a new test scenario:

1. Add input files to `fixtures/input/`
2. Call `runWithConfig('name', { ...options })`
3. Run tests - snapshots are created in `fixtures/output/name/`

## Key Implementation Details

### Feature Detection

- TypeScript: `isPackageExists('typescript')`
- Vue: checks for `vue`, `nuxt`, `vitepress`, or `@slidev/cli` packages
- Other frameworks require explicit opt-in

### Editor Integration

- Detects editor environment via `isInEditorEnv()` (checks for VS Code, WebStorm, etc.)
- Disables auto-fix for certain rules in editor to prevent unwanted changes during refactoring
- Rules disabled: `unused-imports/no-unused-imports`, `test/no-only-tests`, `prefer-const`
- Full linting still occurs in CLI/CI

### Plugin Architecture

Each config file in `src/configs/` typically:

1. Imports relevant ESLint plugins
2. Exports a function that returns `TypedFlatConfigItem[]` or `Promise<TypedFlatConfigItem[]>`
3. Accepts options like `overrides`, `files`, feature flags
4. Returns one or more flat config objects with named configs (e.g., `'antfu/typescript/rules'`)

### Type Generation

- `scripts/typegen.ts`: Generates `src/typegen.d.ts` with rule names and options from all plugins
- Provides autocomplete for rule overrides
- Run automatically as part of build process

## Working with MDX (Current Branch)

The current branch (`feature/mdx`) is adding MDX support:

- Files affected: `src/configs/markdown.ts`, `src/factory.ts`, `src/globs.ts`, `src/types.ts`
- Adding `eslint-plugin-mdx` as dependency
- New glob patterns: `GLOB_MDX`, `GLOB_MARKDOWN_OR_MDX`, etc.
- Test fixtures being updated from `.md` to `.mdx`

## Important Conventions

1. **Plugin Naming**: Always use renamed prefixes in rule overrides (e.g., `ts/`, `style/`, `import/`)
2. **Config Names**: Each config object should have a descriptive `name` field like `'antfu/typescript/rules'`
3. **Overrides Pattern**: All integrations support `overrides` option for rule customization
4. **Files Specificity**: Ensure framework-specific rules use proper `files` globs to avoid processing wrong file types
5. **Auto-renaming**: User configs also get plugin renaming applied automatically since v2.9.0
