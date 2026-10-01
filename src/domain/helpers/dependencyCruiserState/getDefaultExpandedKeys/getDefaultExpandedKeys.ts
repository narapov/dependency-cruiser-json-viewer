import type { CruiseSnapshot } from '../../../types';

/** Default expanded folders: `src` when present as a folder in the cruise snapshot. */
export function getDefaultExpandedKeys(cruiseSnapshot: CruiseSnapshot): string[] {
  const src = cruiseSnapshot.nodes.get('src');
  return src?.isFolder ? ['src'] : [];
}
