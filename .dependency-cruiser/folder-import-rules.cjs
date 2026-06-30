/** @type {import('dependency-cruiser').IForbiddenRuleType[]} */

// =============================================================================
// Folder schema (Feature/) — rules apply recursively at any nesting depth.
//
//   Feature/
//   ├── Feature.tsx          # non-index: ./ and ../ per rules below; ✗ ./index
//   ├── index.ts             # ./ only; ✗ (../)+
//   ├── hooks|helpers|types|contexts|hocs|constants|api/
//   │   └── {child}/         # same schema; ../ to Feature ancestors
//   └── partials/
//       ├── SubFeature/      # branch $2; (../)+ allowed inside partials/$2/…
//       │   ├── helpers/
//       │   │   └── {child}/
//       │   └── partials/
//       │       └── SubSubFeature/   # unbounded partials/ depth
//       └── SubFeature2/       # separate branch — cross-import forbidden
//
// Allowed subfolders (subdir): hooks|partials|hocs|contexts|types|constants|helpers|api
//
// ./ imports (same-dir-no-deep, non-index-no-local-index):
//   ✓ ./{sibling}              ✓ ./{sibling}/index.ts
//   ✓ ./{subdir}/{child}       ✓ ./{subdir}/{child}/index.ts
//   ✗ ./{subdir}/{child}/{grandchild}   ✗ ./partials/A/partials/B
//   ✗ ./index  (in non-index files)
//
// ../ imports (ancestor-*; direct ancestors only; index-no-ancestor for index.ts):
//   ✓ (../)+{name}             ✓ (../)+{name}/index.ts
//   ✓ (../)+{subdir}/{child}   ✓ (../)+{subdir}/{child}/index.ts
//   ✗ (../)+{subdir}/{child}/{grandchild}
//   ✗ (../)+partials/A/partials/B/…
//
// Imports outside $1/ from partials/$2/… (outside-dir-*; $1 = file dir, $2 = branch root):
//   ✓ …/partials/$2/partials/A/partials/B → ../../helpers/{child}
//   ✗ …/partials/$2/… → …/partials/{not $2}/partials/…
//   ✗ …/partials/$2/… → …/partials/{not $2}/{subdir}/…
//
// Scope: src/** except src/i18n/; partials branches — src/App, src/components/{Feature}.
// =============================================================================

// Allowed subfolders for ./{subdir}/{child} and (../)+{subdir}/{child}.
const SUBDIRS_RE = 'hooks|partials|hocs|contexts|types|constants|helpers|api';

// npm, node built-ins, and import type are not checked by folder rules.
const EXTERNAL_DEP_TYPES = ['npm', 'core', 'type-only'];

// src/i18n/ is out of scope — separate import layout (locales/*.json).
const SRC_FOLDER_SCOPE_NOT = '^src/i18n/';

// Max partials/…/partials/… nesting (no * — safe-regex).
const MAX_PARTIALS_DEPTH = 10;

// Prefixes up to the first partials/ — $2 is always the branch root (partials/{name} under Feature/partials/).
// Example: …/Feature/partials/SubFeature/partials/A/partials/B/B.tsx
//   $1 = …/Feature/partials/SubFeature/partials/A/partials/B
//   $2 = SubFeature
const PARTIALS_SCOPE_PREFIXES = [
  { key: 'app', path: '^src/App' },
  { key: 'components', path: '^src/components/[^/]+' },
];

const NON_INDEX_FROM = {
  path: '(^src/.+)/[^/]+$',
  pathNot: ['/index\\.ts$', SRC_FOLDER_SCOPE_NOT],
};

const OUTSIDE_DIR_PATH_NOT = '^$1/';

/**
 * from for a file at depth inside partials/$2/… ($1 = directory, $2 = branch root).
 * @param {string} scopePath
 * @param {number} depth
 */
function partialsFromAtDepth(scopePath, depth) {
  const nested = depth === 0 ? '' : Array(depth).fill('/partials/[^/]+').join('');

  return {
    path: `(${scopePath}/partials/([^/]+)${nested})/[^/]+$`,
    pathNot: ['/index\\.ts$', SRC_FOLDER_SCOPE_NOT],
  };
}

/** pathNot: subdir inside own partials branch at any depth (0..MAX_PARTIALS_DEPTH). */
function ownPartialsBranchPathNots() {
  const result = [];

  for (let depth = 0; depth <= MAX_PARTIALS_DEPTH; depth += 1) {
    const inner = Array(depth).fill('partials/[^/]+/').join('');
    result.push(`partials/$2/${inner}(?:${SUBDIRS_RE})/`);
  }

  return result;
}

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

function buildOutsidePartialsRules() {
  const ownBranchPathNots = ownPartialsBranchPathNots();
  const rules = [];

  for (const { key, path: scopePath } of PARTIALS_SCOPE_PREFIXES) {
    for (let depth = 0; depth <= MAX_PARTIALS_DEPTH; depth += 1) {
      const from = partialsFromAtDepth(scopePath, depth);

      rules.push(
        // outside-dir-no-nested-partials (imports outside $1/, file under partials/$2/…)
        // Allows: (../)+… inside own branch partials/$2/…
        //   ✓ …/partials/$2/partials/A/partials/B → ../../helpers/{child}
        // Forbids: entering another partials branch — partials/{not $2}/partials/…
        //   ✗ …/partials/$2/…/SubFeature2 → …/partials/SubFeature/partials/A
        forbidden(`outside-dir-no-nested-partials-${key}-d${depth}`, from, {
          path: 'partials/[^/]+/partials/',
          pathNot: [OUTSIDE_DIR_PATH_NOT, 'partials/$2/partials/'],
        }),
        // outside-dir-sibling-then-subdir (imports outside $1/, file under partials/$2/…)
        // Allows: (../)+{subdir}/{child} inside partials/$2/…
        //   ✓ …/partials/$2/partials/A/partials/B → ../../helpers/{child}
        // Forbids: partials/{foreign-sibling}/{subdir}/…
        //   ✗ …/partials/SubFeature2/… → …/partials/SubFeature/helpers/{child}
        //   ✗ …/partials/SubFeature2 → ../SubFeature/helpers/{child}
        forbidden(`outside-dir-sibling-then-subdir-${key}-d${depth}`, from, {
          path: `partials/[^/]+/(?:${SUBDIRS_RE})/[^/]+`,
          pathNot: [OUTSIDE_DIR_PATH_NOT, ...ownBranchPathNots],
        }),
      );
    }
  }

  return rules;
}

function buildFolderImportRules() {
  return [
    // index-no-ancestor
    // Allows: ./ only — see same-dir-no-deep.
    //   ✓ Feature/index.ts → ./Feature.tsx
    //   ✓ Feature/index.ts → ./hooks/useXxx
    // Forbids: any (../)+ in index.ts.
    //   ✗ Feature/index.ts → ../OtherFeature
    forbidden(
      'index-no-ancestor',
      {
        path: '^src/.+/index\\.ts$',
        pathNot: SRC_FOLDER_SCOPE_NOT,
      },
      { ancestor: true },
    ),

    // non-index-no-local-index
    // Allows: ./sibling, ./{subdir}/{child}, ../… — everything except ./index of own folder.
    //   ✓ Feature/Feature.tsx → ./hooks/useXxx
    //   ✓ Feature/Feature.tsx → ./partials/SubFeature
    // Forbids: current-folder barrel in non-index files.
    //   ✗ Feature/Feature.tsx → ./index
    //   ✗ helpers/helperName/helper.ts → ./index
    forbidden('non-index-no-local-index', NON_INDEX_FROM, { path: '$1/index\\.ts$' }),

    // same-dir-no-deep (same-folder ./ imports)
    // Allows: ./{sibling}, ./{sibling}/index.ts, ./{subdir}/{child}, ./{subdir}/{child}/index.ts
    //   ✓ Feature/Feature.tsx → ./hooks/useXxx
    //   ✓ Feature/Feature.tsx → ./partials/SubFeature
    //   ✓ Feature/Feature.tsx → ./helpers/helperName/index.ts
    // Forbids: deeper than one level inside the folder.
    //   ✗ Feature/Feature.tsx → ./hooks/useXxx/useXxx
    //   ✗ Feature/Feature.tsx → ./partials/SubFeature/partials/SubSubFeature
    //   ✗ Feature/Feature.tsx → ./helpers/helperName/helperName
    forbidden(
      'same-dir-no-deep',
      {
        path: '(^src/.+)/[^/]+$',
        pathNot: SRC_FOLDER_SCOPE_NOT,
      },
      {
        path: '$1/.+/.+',
        pathNot: [`$1/[^/]+/index\\.ts$`, `$1/(?:${SUBDIRS_RE})/[^/]+$`, `$1/(?:${SUBDIRS_RE})/[^/]+/index\\.ts$`],
      },
    ),

    // ancestor-no-deep-subdir (parent ../ imports; direct ancestors only)
    // Allows: (../)+{name}, (../)+{name}/index.ts, (../)+{subdir}/{child},
    //   (../)+{subdir}/{child}/index.ts.
    //   ✓ …/partials/SubFeature/partials/A/A.tsx → ../../types
    //   ✓ …/partials/SubFeature/partials/A/A.tsx → ../../../hooks/useXxx
    // Forbids: going deeper than {subdir}/{child} via an ancestor.
    //   ✗ …/partials/SubFeature/partials/A/A.tsx → ../../../hooks/useXxx/useXxx
    forbidden('ancestor-no-deep-subdir', NON_INDEX_FROM, {
      ancestor: true,
      path: `(?:${SUBDIRS_RE})/[^/]+/[^/]+`,
      pathNot: `(?:${SUBDIRS_RE})/[^/]+/index\\.ts$`,
    }),

    // ancestor-no-nested-partials (parent ../ imports; direct ancestors only)
    // Allows: (../)+partials/{child}, (../)+partials/{child}/index.ts — one level.
    //   ✓ …/partials/SubFeature/partials/A/A.tsx → ../SubFeature
    // Forbids: (../)+partials/A/partials/B/… via an ancestor.
    //   ✗ …/partials/SubFeature2/… → …/partials/SubFeature/partials/A
    forbidden('ancestor-no-nested-partials', NON_INDEX_FROM, {
      ancestor: true,
      path: 'partials/[^/]+/partials/',
    }),

    ...buildOutsidePartialsRules(),
  ];
}

module.exports = {
  SUBDIRS_RE,
  EXTERNAL_DEP_TYPES,
  SRC_FOLDER_SCOPE_NOT,
  MAX_PARTIALS_DEPTH,
  PARTIALS_SCOPE_PREFIXES,
  NON_INDEX_FROM,
  OUTSIDE_DIR_PATH_NOT,
  partialsFromAtDepth,
  ownPartialsBranchPathNots,
  buildFolderImportRules,
};
