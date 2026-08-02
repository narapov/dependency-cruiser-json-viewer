# Architecture

## Layers

```
Feature roots: src/App, src/Shared, src/domain (excludes src/i18n, src/assets, src/testsUtils)

main → App → App/partials/{Feature}
         ↘ domain
         ↘ Shared
Shared → Shared, domain
domain → domain only
```

- **`src/domain/`** — pure cruise-data logic (no React, no xyflow, no Shared). Import via `from '@/domain'` only. May import **only** `src/domain/`.
- **`src/Shared/`** — reusable code without app logic. Import via `from '@/Shared'` only. May import **`src/Shared/`** and **`src/domain/`**.
- **`src/App/`** (outside `partials/`) — composition, data loading, shared UI coordination. Import partials **only** via `partials/{Name}/index.ts`.
- **`src/App/partials/{Feature}/`** — feature modules. May import Shared, domain, and the same feature tree. No layer isolation between App partials (folder rules only).

Layer boundaries are enforced by [`.dependency-cruiser/layer-import-rules.mjs`](../.dependency-cruiser/layer-import-rules.mjs) (`domain-only-domain`, `shared-only-shared-and-domain`, `shared-feature-partials-only-shared-domain-and-self`, `domain-feature-partials-only-domain-and-self`, `app-root-only-shared-domain-and-partial-barrels`).

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

Rules are **recursive** — the same constraints apply at every folder depth. Enforced by [`.dependency-cruiser/folder-import-rules.mjs`](../.dependency-cruiser/folder-import-rules.mjs) (`npm run depcruise`). Scope: `src/**` except `src/i18n/`, `src/assets/`, and `src/testsUtils/`.

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

Cross-feature boundaries between App partials are **not** covered by layer rules (folder rules apply within each feature tree).

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

- **API boundary** — e.g. `DependencyGraph/helpers` exports `assignFolderColors` but not test helpers; `QuickPick/helpers` exports search helpers but not `PathSearchTier`; `FileTree/index` omits `computeCheckState`.
- **Name collisions** — e.g. `AppLayout/hooks` renames `DEFAULT_WIDTH` / `MIN_WIDTH` from sidebar vs panel hooks.
- **Default export** — `export *` does not re-export `default`.

## Import rules

| From                    | Import                                                           |
| ----------------------- | ---------------------------------------------------------------- |
| Anywhere outside Shared | `from '@/Shared'` only                                           |
| App, App/partials       | `from '@/domain'` only                                           |
| App root internals      | `from './hooks'`, `from './partials/FileTree'` (barrel)          |
| Between App features    | `from '../FileTree'` (barrel)                                    |
| Inside a module         | `from './partials/X'`, `from './helpers/X'` (via their index.ts) |

Forbidden:

- `from '@/Shared/components/Tree'`
- `from '@/App/helpers'`
- `from '../FileTree/partials/...'`
- `from '../DependencyGraph/helpers/...'` (use feature barrel)
- `from '../DependencyGraph/types/...'` (use `ComponentName.types.ts` or feature barrel)
- `from '@/domain/pathUtils'` (use domain root barrel)
- From App root: `from './partials/FileTree/helpers/...'` (partial barrels only)

## Enforcement

- `dependency-cruiser` — layer rules ([`.dependency-cruiser/layer-import-rules.mjs`](../.dependency-cruiser/layer-import-rules.mjs)) and folder import rules for `src/**` ([`.dependency-cruiser/folder-import-rules.mjs`](../.dependency-cruiser/folder-import-rules.mjs), `npm run depcruise`). See [Folder import rules](#folder-import-rules-per-directory) above.

React 19: `ref` is a regular prop (no `forwardRef`). Project uses React Compiler — avoid manual `useCallback`/`useMemo` in new code.
