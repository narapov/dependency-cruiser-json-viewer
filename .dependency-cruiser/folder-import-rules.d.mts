import type { IFromRestriction, IRegularForbiddenRuleType } from 'dependency-cruiser';

export const SUBDIRS_RE: string;
export const EXTERNAL_DEP_TYPES: string[];
export const SRC_FEATURE_ROOTS: string[];
export const SRC_FOLDER_SCOPE_NOT: string;
export const FIXTURES_PATH_NOT: string;
export const MAX_PARTIALS_DEPTH: number;
export const PARTIALS_SCOPE_PREFIXES: ReadonlyArray<{ key: string; path: string }>;
export const NON_INDEX_FROM: IFromRestriction;
export const OUTSIDE_DIR_PATH_NOT: string;

export function partialsFromAtDepth(scopePath: string, depth: number): IFromRestriction;
export function ownPartialsBranchPathNots(): string[];
export function buildFolderImportRules(): IRegularForbiddenRuleType[];
