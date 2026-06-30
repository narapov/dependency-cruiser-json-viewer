# Architecture

## Layers

```
main → App → components/* → domain → Shared
```

- **`src/domain/`** — cruise data logic (`IModule[]`, path utils, folder expansion, module relations). Import via `from '../../domain'` (root barrel only). May import **only** `src/domain/`.
- **`src/Shared/`** — reusable code without app logic. Import **only** via `from '../../Shared'` (root barrel). May import **`src/Shared/`** and **`src/domain/`**.
- **`src/App/`** — root composition: data loading, shared UI state coordination (`useAppOrchestration`).
- **`src/components/*`** — feature modules (FileTree, DependencyGraph, QuickPick, DependencyPanel, AppLayout). May import **`src/Shared/`**, **`src/domain/`**, and files within the **same** `src/components/{Feature}/` tree.
- **`src/components/AppLayout/`** — layout shell only (resize handles, CSS regions, slots).

Layer boundaries are enforced by [`.dependency-cruiser/layer-import-rules.cjs`](../.dependency-cruiser/layer-import-rules.cjs) (`domain-only-domain`, `shared-only-shared-and-domain`, `components-only-shared-domain-and-self`).

## Module structure

Each public module is a folder with `ComponentName.tsx` + `index.ts`:

```
Feature/
├── Feature.tsx              # non-index: ./ and ../ per folder rules; ✗ ./index
├── Feature.module.css
├── Feature.types.ts         # thin barrel → types/
├── index.ts                 # only ./ imports; ✗ (../)+
├── types/
│   ├── SomeType.ts
│   └── index.ts
├── contexts/
│   └── ContextName/
│       ├── ContextName.tsx
│       └── index.ts
├── helpers/
│   └── helperName/
│       ├── helperName.ts    # ✗ ./index
│       └── index.ts
├── hooks/
│   └── useXxx/
│       ├── useXxx.ts
│       └── index.ts
├── hocs/
├── constants/
├── api/
└── partials/
    ├── SubFeature/          # partials branch ($2); same rules, parent via (../)+
    │   ├── SubFeature.tsx
    │   ├── helpers/
    │   └── partials/
    │       └── SubSubFeature/   # unbounded partials/ nesting
    └── SubFeature2/           # separate branch — no cross-imports into SubFeature/
```

- **Private subcomponents** → `partials/SubComponent/`
- **Private utilities** → `helpers/helperName/`
- **Domain types** → `types/TypeName.ts` (≤2 related interfaces per file)
- **Type barrel** → `ComponentName.types.ts` (re-export only, no definitions)
- **Styles** → `ComponentName.module.css`

Import from outside a module **only through its `index.ts`**.

Allowed subfolders (`subdir`): `hooks`, `partials`, `hocs`, `contexts`, `types`, `constants`, `helpers`, `api`.

### Folder import rules (per directory)

Rules are **recursive** — the same constraints apply at every folder depth. Enforced by [`.dependency-cruiser/folder-import-rules.cjs`](../.dependency-cruiser/folder-import-rules.cjs) (`npm run depcruise`). Scope: `src/**` except `src/i18n/`.

| Direction                                | Allowed                                                                                                                                 | Forbidden                                                                                             |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `./` in any non-`index.ts`               | `./{sibling}`, `./{sibling}/index.ts`, `./{subdir}/{child}`, `./{subdir}/{child}/index.ts`                                              | `./index`, paths deeper than `{subdir}/{child}` (e.g. `./hooks/useX/useX`, `./partials/A/partials/B`) |
| `./` in `index.ts`                       | same as above                                                                                                                           | any `(../)+`                                                                                          |
| `../` in non-`index.ts`                  | `(../)+{name}`, `(../)+{name}/index.ts`, `(../)+{subdir}/{child}`, `(../)+{subdir}/{child}/index.ts` (target must be a direct ancestor) | deeper chains via ancestor, `(../)+partials/A/partials/B/…`                                           |
| outside current dir from `partials/$2/…` | `(../)+…` staying inside branch `partials/$2/…` (e.g. `../../helpers/{child}` from `partials/$2/partials/A/partials/B`)                 | `partials/{other}/partials/…`, `partials/{other}/{subdir}/…`                                          |

`$1` — importer’s directory; `$2` — root name of the partials branch (`partials/$2/` immediately under `Feature/partials/`).

**dependency-cruiser rule names:**

| Rule                                | Purpose                                                 |
| ----------------------------------- | ------------------------------------------------------- |
| `index-no-ancestor`                 | `index.ts` cannot import parents                        |
| `non-index-no-local-index`          | non-index files cannot import `./index` of their folder |
| `same-dir-no-deep`                  | `./` imports limited to one subdir level                |
| `ancestor-no-deep-subdir`           | `../` cannot reach deeper than `{subdir}/{child}`       |
| `ancestor-no-nested-partials`       | `../` cannot cross `partials/A/partials/B`              |
| `outside-dir-no-nested-partials-*`  | lateral import into another partials branch             |
| `outside-dir-sibling-then-subdir-*` | lateral import into `{subdir}` of a sibling partial     |

Cross-feature boundaries are **not** covered by these rules (planned separately).

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

| Situation                              | Pattern                               |
| -------------------------------------- | ------------------------------------- |
| Single source, entire module is public | `export * from './module'`            |
| Multiple sources, all public           | several `export * from './submodule'` |
| Hide part of the API                   | named `export { a, b } from '...'`    |
| Name collision between modules         | `export { X as Y } from '...'`        |
| Default export (`App`)                 | `export { default } from './App'`     |

Use **named** re-exports only when intentional:

- **API boundary** — e.g. `DependencyGraph/helpers` exports `assignFolderColors` but not test helpers; `QuickOpen/helpers` exports search helpers but not `PathSearchTier`; `FileTree/index` omits `computeCheckState`.
- **Name collisions** — e.g. `AppLayout/hooks` renames `DEFAULT_WIDTH` / `MIN_WIDTH` from sidebar vs panel hooks.
- **Default export** — `export *` does not re-export `default`.

## Import rules

| From                    | Import                                                           |
| ----------------------- | ---------------------------------------------------------------- |
| Anywhere outside Shared | `from '../../Shared'` only                                       |
| App, components         | `from '../../domain'` only                                       |
| App internals           | `from './hooks'`                                                 |
| Between features        | `from '../FileTree'` (barrel)                                    |
| Inside a module         | `from './partials/X'`, `from './helpers/X'` (via their index.ts) |

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

`useAppOrchestration` holds **shared UI state only**: `selectedPaths`, `expandedKeys`, `activePath`, `dependenciesPath`. Initial values come from `useInitialDependencyCruiserState`, which delegates to domain `getInitialDependencyCruiserState(sources)` — with no FileTree dependency. Cross-pane navigation uses imperative refs on `FileTree` (`focusPath`) and `DependencyGraph` (`focusNode`).

Feature modules own their data:

- **FileTree** — `buildFileTree`, tree selection helpers, tree UI
- **DependencyGraph** — `assignFolderColors`, `buildGraph`, graph rendering
- **QuickOpen** — search state, keyboard shortcut (Cmd/Ctrl+P)

## Imperative handles

| Handle                  | Method            | Purpose                       |
| ----------------------- | ----------------- | ----------------------------- |
| `FileTreeHandle`        | `focusPath(path)` | Scroll to and focus tree item |
| `DependencyGraphHandle` | `focusNode(path)` | `fitView` to graph node       |

React 19: `ref` is a regular prop (no `forwardRef`). Project uses React Compiler — avoid manual `useCallback`/`useMemo` in new code.

## Enforcement

- ESLint `no-restricted-imports` — blocks deep Shared imports and cross-module internals.
- `dependency-cruiser` — layer rules ([`.dependency-cruiser/layer-import-rules.cjs`](../.dependency-cruiser/layer-import-rules.cjs)) and folder import rules for `src/**` ([`.dependency-cruiser/folder-import-rules.cjs`](../.dependency-cruiser/folder-import-rules.cjs), `npm run depcruise`). See [Folder import rules](#folder-import-rules-per-directory) above.
