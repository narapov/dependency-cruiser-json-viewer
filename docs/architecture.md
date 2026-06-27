# Architecture

## Layers

```
main → App → components/* → domain → Shared
```

- **`src/domain/`** — cruise data logic (`IModule[]`, path utils, folder expansion, module relations). Import via `from '../../domain'` (root barrel only).
- **`src/Shared/`** — reusable code without app logic. Import **only** via `from '../../Shared'` (root barrel).
- **`src/App/`** — root composition: data loading, shared UI state coordination (`useAppOrchestration`).
- **`src/components/*`** — feature modules (FileTree, DependencyGraph, QuickOpen, DependencyPanel, AppLayout).
- **`src/components/AppLayout/`** — layout shell only (resize handles, CSS regions, slots).

## Module structure

Each public module is a folder with `ComponentName.tsx` + `index.ts`:

- **Private subcomponents** → `partials/SubComponent/`
- **Private utilities** → `helpers/helperName/`
- **Domain types** → `types/TypeName.ts` (≤2 related interfaces per file)
- **Type barrel** → `ComponentName.types.ts` (re-export only, no definitions)
- **Styles** → `ComponentName.module.css`

Import from outside a module **only through its `index.ts`**.

## Types in modules

```
ComponentName/
├── ComponentName.types.ts   # thin barrel → re-export from types/
└── types/
    ├── SomeType.ts          # ≤2 related interfaces
    └── index.ts
```

- `ComponentName.types.ts` contains **no definitions** — only re-exports from `./types`.
- Props types (`*Props`) stay next to the component (`.tsx`), not in `types/`.
- Runtime code (guards, utilities) belongs in `helpers/`, not in `types/`.

## Types in helpers

A type may stay colocated in a helper file **only when** its consumers are the helper itself and its tests. If the type is used elsewhere in the module, move it to `types/`.

Do not re-export helper-local types from module barrels unless they are part of the public API.

## Barrel exports

Each `index.ts` re-exports its module. Prefer `export * from` — barrels stay in sync with implementations during refactors.

| Situation | Pattern |
|-----------|---------|
| Single source, entire module is public | `export * from './module'` |
| Multiple sources, all public | several `export * from './submodule'` |
| Hide part of the API | named `export { a, b } from '...'` |
| Name collision between modules | `export { X as Y } from '...'` |
| Default export (`App`) | `export { default } from './App'` |

Use **named** re-exports only when intentional:

- **API boundary** — e.g. `DependencyGraph/helpers` exports `assignFolderColors` but not test helpers; `QuickOpen/helpers` exports search helpers but not `PathSearchTier`; `FileTree/index` omits `computeCheckState`.
- **Name collisions** — e.g. `AppLayout/hooks` renames `DEFAULT_WIDTH` / `MIN_WIDTH` from sidebar vs panel hooks.
- **Default export** — `export *` does not re-export `default`.

## Import rules

| From | Import |
|------|--------|
| Anywhere outside Shared | `from '../../Shared'` only |
| App, components | `from '../../domain'` only |
| App internals | `from './hooks'` |
| Between features | `from '../FileTree'` (barrel) |
| Inside a module | `from './partials/X'`, `from './helpers/X'` (via their index.ts) |

Forbidden:

- `from '../../Shared/components/Tree'`
- `from '../../App/helpers'`
- `from '../FileTree/partials/...'`
- `from '../DependencyGraph/helpers/...'` (use feature barrel)
- `from '../DependencyGraph/types/...'` (use `ComponentName.types.ts` or feature barrel)
- `from '../../domain/pathUtils'` (use domain root barrel)

## Domain structure

```
domain/
├── helpers/
│   ├── pathUtils/
│   ├── folderExpansion/
│   ├── dependencyCruiserState/   # getInitialDependencyCruiserState, getDefaultSelectedKeys, …
│   └── moduleRelations/
├── types/
│   ├── DependencyCruiserState.ts
│   └── ModuleRelations.ts
└── index.ts
```

Pure logic over `dependency-cruiser` data. No React, no xyflow, no Shared imports.

## Shared categories

```
Shared/
├── components/
├── hooks/        # useResizableWidth
├── helpers/      # copyToClipboard, queryClient, graphTheme
├── styles/       # graphTheme.css (CSS variables for graph colors)
├── types/        # cross-shared types (placeholder)
└── contexts/     # placeholder
```

## App structure

```
App/
├── App.tsx
├── hooks/        # useCruiseResult, useAppOrchestration, useInitialDependencyCruiserState
└── api/          # cruiseResult
```

`useAppOrchestration` holds **shared UI state only**: `selectedPaths`, `expandedKeys`, `activePath`, `dependenciesPath`. Initial values come from `useInitialDependencyCruiserState`, which delegates to domain `getInitialDependencyCruiserState(sources)` — без зависимости от FileTree. Cross-pane navigation uses imperative refs on `FileTree` (`focusPath`) and `DependencyGraph` (`focusNode`).

Feature modules own their data:

- **FileTree** — `buildFileTree`, tree selection helpers, tree UI
- **DependencyGraph** — `assignFolderColors`, `buildGraph`, graph rendering
- **QuickOpen** — search state, keyboard shortcut (Cmd/Ctrl+P)

## Imperative handles

| Handle | Method | Purpose |
|--------|--------|---------|
| `FileTreeHandle` | `focusPath(path)` | Scroll to and focus tree item |
| `DependencyGraphHandle` | `focusNode(path)` | `fitView` to graph node |

React 19: `ref` is a regular prop (no `forwardRef`). Project uses React Compiler — avoid manual `useCallback`/`useMemo` in new code.

## Enforcement

- ESLint `no-restricted-imports` — blocks deep Shared imports and cross-module internals.
- `dependency-cruiser` — layer boundary rules (`npm run depcruise`).
