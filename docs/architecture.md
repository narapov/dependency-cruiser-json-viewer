# Architecture

## Layers

```
main → App → components/* → Shared
```

- **`src/Shared/`** — reusable code without app logic. Import **only** via `from '../../Shared'` (root barrel).
- **`src/App/`** — root orchestrator: data loading, app state, feature coordination.
- **`src/components/*`** — feature modules (FileTree, DependencyGraph, QuickOpen, DependencyPanel, AppLayout).
- **`src/components/AppLayout/`** — layout shell only (resize handles, CSS regions, slots).

## Module structure

Each public module is a folder with `ComponentName.tsx` + `index.ts`:

- **Private subcomponents** → `partials/SubComponent/`
- **Private utilities** → `helpers/helperName/`
- **Domain types** → `types/TypeName/` (≤2 related interfaces per file)
- **Type barrel** → `ComponentName.types.ts` (re-export only, no definitions)
- **Styles** → `ComponentName.module.css`

Import from outside a module **only through its `index.ts`**.

## Types in modules

```
ComponentName/
├── ComponentName.types.ts   # thin barrel → re-export from types/
└── types/
    ├── SomeType/
    │   ├── SomeType.ts      # ≤2 related interfaces
    │   └── index.ts
    └── index.ts
```

- `ComponentName.types.ts` contains **no definitions** — only re-exports from `./types`.
- Props types (`*Props`) stay next to the component (`.tsx`), not in `types/`.
- Runtime code (guards, utilities) belongs in `helpers/`, not in `types/`.

## Types in helpers

A type may stay colocated in a helper file **only when** its consumers are the helper itself and its tests. If the type is used elsewhere in the module, move it to `types/`.

Do not re-export helper-local types from module barrels unless they are part of the public API.

## Import rules

| From | Import |
|------|--------|
| Anywhere outside Shared | `from '../../Shared'` only |
| App internals | `from './helpers'`, `from './hooks'` |
| Between features | `from '../FileTree'` (barrel) |
| Inside a module | `from './partials/X'`, `from './helpers/X'` (via their index.ts) |

Forbidden:

- `from '../../Shared/components/Tree'`
- `from '../../App/helpers'`
- `from '../FileTree/partials/...'`
- `from '../DependencyGraph/helpers/...'` (use feature barrel)
- `from '../DependencyGraph/types/...'` (use `ComponentName.types.ts` or feature barrel)

## Shared categories

```
Shared/
├── components/   # Tree, …
├── hooks/        # useResizableWidth
├── helpers/      # copyToClipboard, queryClient
├── types/        # cross-shared types (placeholder)
└── contexts/     # placeholder
```

## App structure

```
App/
├── App.tsx
├── hooks/        # useCruiseResult, useAppOrchestration, useQuickOpenShortcut
├── helpers/      # buildFileTree, searchTreeNodes, treeSelection, assignFolderColors
└── api/          # cruiseResult
```

`App/helpers` and `App/hooks` are private — only used inside `App/`.

## Enforcement

- ESLint `no-restricted-imports` — blocks deep Shared imports and cross-module internals.
- `dependency-cruiser` — layer boundary rules (`npm run depcruise`).
