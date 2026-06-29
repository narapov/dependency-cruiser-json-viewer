# AGENTS.md

Instructions for AI coding agents working in this repository.

## Project overview

Interactive browser viewer for [dependency-cruiser](https://github.com/sverweij/dependency-cruiser) JSON cruise results — explore file trees, dependency graphs, and module relations.

**Stack:** React 19, TypeScript 6, Vite 8, MUI, React Flow (`@xyflow/react`), TanStack Query, i18next.

**Entry point:** `src/main.tsx` → `src/App/App.tsx`.

## Commands

| Command                          | Description                                                     | When to run                             |
| -------------------------------- | --------------------------------------------------------------- | --------------------------------------- |
| `npm run dev`                    | Start Vite dev server                                           | Local development                       |
| `npm run build`                  | Type-check and build for production                             | Before finishing a task                 |
| `npm run preview`                | Preview production build                                        | After build verification                |
| `npm run test`                   | Run Vitest suite                                                | After logic changes                     |
| `npm run lint`                   | Run ESLint                                                      | After any TS/TSX changes                |
| `npm run format`                 | Format all files with Prettier                                  | After formatting-related config changes |
| `npm run format:check`           | Check formatting (CI-friendly)                                  | After TS/TSX changes                    |
| `npm run depcruise`              | Validate layer rules on `src`                                   | After import/layer changes              |
| `npm run depcruise:json`         | Export cruise result to `public/cruise-result.json`             | When sample data needs refresh          |
| `npm run depcruise:json-for-cli` | Export cruise result to `test-data/cruise-result.json`          | When CLI test data needs refresh        |
| `npm run cli:verify`             | Build, refresh `test-data/cruise-result.json`, start CLI server | Local CLI verification                  |

**Verification checklist before finishing:**

1. `npm run lint`
2. `npm run format:check`
3. `npm run test`
4. `npm run depcruise` (if imports or layer boundaries changed)
5. `npm run build` (for non-trivial changes)

**Git hooks** (installed automatically via `npm install` → `prepare`):

- **pre-commit:** ESLint (`--fix --max-warnings=0`) and Prettier on staged files via lint-staged
- **commit-msg:** Conventional Commits enforced by commitlint (`type: subject`, e.g. `feat: add quick pick`)

## Architecture

```
App  →  components, domain, Shared, i18n
components  →  domain, Shared
domain  →  stdlib + dependency-cruiser types only
Shared  →  no App, components, or domain
```

### Import rules

Enforced by `eslint.config.ts` and `.dependency-cruiser.cjs`:

- Import **`domain`** only from `src/domain/index.ts` (e.g. `from '../../domain'`).
- Import **`Shared`** only from `src/Shared/index.ts` (e.g. `from '../../Shared'`).
- Do not import `App/helpers/*` outside `App/`.
- Do not deep-import `partials/`, `helpers/`, or `types/` — use the module's public `index.ts` or `ComponentName.types.ts`.
- `Shared/` is exempt from ESLint import restrictions internally.

### dependency-cruiser forbidden rules

| Rule                               | From              | To (forbidden)                |
| ---------------------------------- | ----------------- | ----------------------------- |
| `no-app-from-components`           | `src/components/` | `src/App/`                    |
| `no-shared-from-app-or-components` | `src/Shared/`     | `src/App/`, `src/components/` |
| `no-domain-from-upper-layers`      | `src/domain/`     | `src/App/`, `src/components/` |
| `no-shared-from-domain`            | `src/Shared/`     | `src/domain/`                 |

### Legacy — do not extend

- `src/lib/` — orphaned; logic lives in `domain/` and `components/*/helpers/`.
- `src/hooks/` — orphaned; use `App/hooks/` or per-component hooks instead.
- `src/components/QuickOpen/` — replaced by `QuickPick`; still on disk but unused.

## Where to put new code

| What                                 | Where                        |
| ------------------------------------ | ---------------------------- |
| Reusable UI feature                  | `src/components/<Feature>/`  |
| App-only dialogs, header, status bar | `src/App/partials/`          |
| App orchestration and state          | `src/App/hooks/`             |
| Pure business logic                  | `src/domain/helpers/<name>/` |
| Cross-cutting utilities              | `src/Shared/`                |
| HTTP / data fetching (app-level)     | `src/App/api/`               |

### Component module layout

Follow the pattern in `src/components/FileTree/`:

```
Feature/
  Feature.tsx
  Feature.module.css
  index.ts                  # public barrel
  partials/                 # private subcomponents
  helpers/<fn>/<fn>.ts      # each helper in its own folder + index.ts
  hooks/useXxx/useXxx.ts    # each hook in its own folder + index.ts
  types/ or Feature.types.ts
```

## Code conventions

- Functional React components; `ref` is a regular prop (React 19).
- React Compiler is enabled — avoid manual `useMemo`/`useCallback` unless there is a clear reason.
- UI: prefer MUI components and APIs (`@mui/material`, `@mui/icons-material`, `@mui/x-tree-view`) over custom markup or third-party UI libraries. Use CSS modules (`*.module.css`) only for layout or styling that MUI does not cover.
- Naming: PascalCase folders/files for components, `useXxx` for hooks, barrel `index.ts` in each folder.
- Tool config files (Prettier, commitlint, Vite, etc.): prefer `*.config.ts` when the tool supports TypeScript; use `.cjs` / `.mjs` only when the tool requires it or TS is not supported.
- Keep diffs minimal — do not change unrelated code.

## Testing

- **Runner:** Vitest (`vitest run`), config inline in `vite.config.ts`.
- **Environment:** `node` (no jsdom).
- **Location:** co-located `*.test.ts` next to source — no `__tests__/` folders.
- **Focus:** domain helpers (primary), component helpers, Shared helpers, selected hooks.
- **Style:** `describe`/`it`/`expect` from `vitest`; inline test factories where needed.

## i18n

- All user-facing strings via `useTranslation()` + `t('key')`.
- When adding keys, update **all five** locale files in `src/i18n/locales/`:
  `en.json`, `fr.json`, `de.json`, `ru.json`, `es.json`.
- Language options and persistence: `src/i18n/languageOptions.ts`, `src/i18n/config.ts`.

## Scope and safety

- Do not commit unless explicitly asked.
- Do not add markdown or documentation files unless requested.
- Do not read or commit secrets (`.env`, credentials).
