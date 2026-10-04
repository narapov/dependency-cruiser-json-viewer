import type { DependencyType, IForbiddenRuleType, IRegularForbiddenRuleType } from 'dependency-cruiser';

type FromRestriction = IRegularForbiddenRuleType['from'];
type ToRestriction = IRegularForbiddenRuleType['to'];

/** npm, node built-ins, and npm-dev (vitest, …) are not checked by layer rules. */
export const EXTERNAL_DEP_TYPES: DependencyType[] = ['npm', 'npm-dev', 'core'];

function forbidden(name: string, from: FromRestriction, to: ToRestriction): IForbiddenRuleType {
  return {
    name,
    severity: 'error',
    from,
    to: {
      dependencyTypesNot: EXTERNAL_DEP_TYPES,
      ...to,
    },
  };
}

/** Build layer-boundary forbidden rules for src/domain, Shared, and App. */
export function buildLayerImportRules(): IRegularForbiddenRuleType[] {
  return [
    // domain-only-domain
    // Allows: imports within src/domain/.
    //   ✓ domain/helpers/pathUtils → domain/types
    // Forbids: any other src layer.
    //   ✗ domain/helpers/foo → Shared/helpers/bar
    //   ✗ domain/helpers/foo → App/partials/Feature/…
    forbidden('domain-only-domain', { path: '^src/domain/' }, { pathNot: '^src/domain/' }),

    // shared-only-shared-and-domain
    // Allows: src/Shared/ and src/domain/.
    //   ✓ Shared/hooks/useX → domain/helpers/pathUtils
    //   ✓ Shared/helpers/foo → Shared/components/bar
    // Forbids: App, i18n, …
    //   ✗ Shared/helpers/foo → App/partials/Feature
    //   ✗ Shared/helpers/foo → App/hooks/useX
    // Test files may import src/testsUtils/ (shared test helpers).
    forbidden(
      'shared-only-shared-and-domain',
      { path: '^src/Shared/', pathNot: '\\.test\\.(ts|tsx)$' },
      {
        pathNot: ['^src/Shared/', '^src/domain/'],
      },
    ),

    // shared-feature-partials-only-shared-domain-and-self
    // $1 = src/Shared/partials/{Feature}
    forbidden(
      'shared-feature-partials-only-shared-domain-and-self',
      { path: '(^src/Shared/partials/([^/]+))/' },
      { pathNot: ['^src/Shared/', '^src/domain/', '$1/'] },
    ),

    // domain-feature-partials-only-domain-and-self
    // $1 = src/domain/partials/{Feature}
    forbidden(
      'domain-feature-partials-only-domain-and-self',
      { path: '(^src/domain/partials/([^/]+))/' },
      { pathNot: ['^src/domain/', '$1/'] },
    ),

    // app-root-only-shared-domain-and-partial-barrels
    // From App root (hooks, api, App.tsx) — not under partials/.
    // Allows: Shared, domain, i18n, intra-App imports, and partial barrels only.
    //   ✓ App/hooks/useAppOrchestration → App/partials/FileTree/index.ts
    //   ✓ App/App.tsx → App/hooks/index.ts
    // Forbids: deep imports into partials internals.
    //   ✗ App/hooks/useAppOrchestration → App/partials/FileTree/helpers/treeIndex
    forbidden(
      'app-root-only-shared-domain-and-partial-barrels',
      {
        path: '^src/App/',
        pathNot: '^src/App/partials/',
      },
      {
        path: '^src/App/partials/[^/]+/(?!index\\.ts$).+',
      },
    ),
  ] as IRegularForbiddenRuleType[];
}
