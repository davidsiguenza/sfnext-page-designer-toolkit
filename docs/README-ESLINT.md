# ESLint Configuration & TypeScript Enforcement

This project uses ESLint for code quality and enforces TypeScript over JavaScript for source code files.

## Setup

The ESLint configuration is already set up with the following features:

- **TypeScript Support**: Full TypeScript linting with `@typescript-eslint`
- **React 19 Support**: Optimized for React 19
- **JavaScript → TypeScript Enforcement**: Prevents `.js`, `.jsx`, `.mjs`, `.cjs` files in source code
- **Other File Types Allowed**: CSS, JSON, and other non-JavaScript files are permitted
- **Server/Client Separation**: Different rules for server and client components

## Scripts

```bash
# Lint all TypeScript files
pnpm lint

# Lint and auto-fix issues
pnpm lint:fix

# Check that no JavaScript files exist in source
node scripts/check-typescript-only.js

# Build (includes JavaScript file check)
pnpm build
```

## TypeScript Enforcement

The project enforces TypeScript over JavaScript through:

1. **ESLint Configuration**: Ignores JavaScript files (`.js`, `.jsx`, `.mjs`, `.cjs`)
2. **Build Script**: Checks for JavaScript files before building
3. **Pre-commit Hook**: Optional script to check staged files

### Blocked File Extensions

- `.js` - JavaScript files (must be `.ts`)
- `.jsx` - JavaScript files with JSX (must be `.tsx`)
- `.mjs` - ES modules JavaScript (must be `.ts`)
- `.cjs` - CommonJS JavaScript (must be `.ts`)

### Allowed File Extensions

- `.ts` - TypeScript files
- `.tsx` - TypeScript files with JSX
- `.css` - CSS files
- `.json` - JSON files
- `.md` - Markdown files
- `.svg` - SVG files
- And other non-JavaScript file types

### Excluded from Linting

- Configuration files (`.eslintrc.js`, `vite.config.ts`, etc.)
- Build artifacts (`dist/`, `build/`, `.vite/`)
- Dependencies (`node_modules/`)
- Scripts (`scripts/*.js`)

## React 19 Server Components Rules

The ESLint configuration includes specific rules for React 19:

- **Server Components**: Relaxed rules for async server components
- **Client Components**: Stricter rules for interactive components
- **Hooks**: Proper React Hooks usage enforcement
- **Refresh**: React Refresh compatibility checks

## Performance tuning

### `@typescript-eslint/no-misused-promises` — `checksVoidReturn.attributes: false`

The `no-misused-promises` rule (enabled at `error` via `recommended-type-checked`) catches Promise-returning functions passed to positions that expect a void-returning callable. Its `checksVoidReturn` sub-check covers four positions:

- **argument** — `callMe(asyncFn)` where `callMe(cb: () => void)`
- **variable** — `const v: () => void = asyncFn`
- **property** — `{ onClick: asyncFn }`
- **attribute** — `<button onClick={asyncFn} />`

The attribute traversal asks the type-checker about every JSX event-handler attribute (`onClick`, `onChange`, `onSubmit`, …) on every component. Across thousands of TSX files the fan-out dominates lint runtime — customers reported `pnpm lint` exceeding 30 minutes on slow CI runners, with `TIMING=` data attributing 65%+ of total time to this rule.

The config disables only the attribute case (`checksVoidReturn: { attributes: false }`). Argument, variable, and property checks remain at error level — those are where the rule catches the bugs that actually lose work (`window.addEventListener('beforeunload', async () => …)`, async functions assigned to void-typed slots, etc.). React's synthetic event system doesn't await JSX event handlers, so the attribute case mostly enforces a stylistic `() => void asyncHandler()` wrapper rather than catching real bugs; unhandled rejections inside an async handler are still caught by `no-floating-promises`.

To re-enable the attribute check (e.g. as part of a broader migration to `oxlint` or another faster linter), remove the override in `eslint.config.js` and the preset default reasserts itself.

## Customization

To modify the ESLint rules, edit `.eslintrc.js`. The configuration uses the new flat config format and includes:

- Base JavaScript rules
- TypeScript-specific rules
- React 19 rules
- Server/Client component specific overrides

## Editor Integration

ESLint will be automatically detected by most editors. For manual setup:

1. Install ESLint extension in your editor
2. Point to `.eslintrc.js` in the project root
3. Enable auto-fix on save if desired

## Pre-commit Hook (Optional)

To use the pre-commit hook:

```bash
# Make the script executable
chmod +x scripts/pre-commit.js

# Add to your git hooks (if using a tool like husky)
# Or run manually before commits
node scripts/pre-commit.js
```

This will check that no JavaScript files are staged before allowing commits.
