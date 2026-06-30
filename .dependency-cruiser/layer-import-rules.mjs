/** @type {import('dependency-cruiser').IForbiddenRuleType[]} */

// npm, node built-ins, npm-dev (vitest, …), and import type are not checked by layer rules.
const EXTERNAL_DEP_TYPES = ['npm', 'npm-dev', 'core', 'type-only'];

/**
 * @param {string} name
 * @param {import('dependency-cruiser').IFromRestrictionType} from
 * @param {import('dependency-cruiser').IToRestrictionType} to
 * @returns {import('dependency-cruiser').IForbiddenRuleType}
 */
function forbidden(name, from, to) {
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

function buildLayerImportRules() {
  return [
    // domain-only-domain
    // Allows: imports within src/domain/.
    //   ✓ domain/helpers/pathUtils → domain/types
    // Forbids: any other src layer.
    //   ✗ domain/helpers/foo → Shared/helpers/bar
    //   ✗ domain/helpers/foo → components/Feature/…
    forbidden('domain-only-domain', { path: '^src/domain/' }, { pathNot: '^src/domain/' }),

    // shared-only-shared-and-domain
    // Allows: src/Shared/ and src/domain/.
    //   ✓ Shared/hooks/useX → domain/helpers/pathUtils
    //   ✓ Shared/helpers/foo → Shared/components/bar
    // Forbids: App, components, i18n, …
    //   ✗ Shared/helpers/foo → components/Feature
    //   ✗ Shared/helpers/foo → App/hooks/useX
    forbidden(
      'shared-only-shared-and-domain',
      { path: '^src/Shared/' },
      {
        pathNot: ['^src/Shared/', '^src/domain/'],
      },
    ),

    // components-only-shared-domain-and-self
    // $1 = src/components/{Feature}
    // Allows: Shared, domain, and the same feature folder.
    //   ✓ components/Feature/Feature.tsx → ./hooks/useX
    //   ✓ components/Feature/… → ../../domain
    //   ✓ components/Feature/… → ../../../../Shared
    // Forbids: App, other features, i18n, …
    //   ✗ components/Feature/… → components/OtherFeature
    //   ✗ components/Feature/… → App/partials/AppHeader
    forbidden(
      'components-only-shared-domain-and-self',
      { path: '(^src/components/([^/]+))/' },
      { pathNot: ['^src/Shared/', '^src/domain/', '$1/'] },
    ),
  ];
}

export { EXTERNAL_DEP_TYPES, buildLayerImportRules };
