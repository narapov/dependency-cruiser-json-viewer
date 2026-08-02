import type { ModuleRelation } from '@/domain';

/** Recursively collect expand keys for every group that has children. */
function collectExpandedKeys(items: ModuleRelation[], keyPrefix: string, into: Set<string>): void {
  items.forEach(item => {
    if ((item.children?.length ?? 0) > 0) {
      const key = `${keyPrefix}${item.path}`;
      into.add(key);
      collectExpandedKeys(item.children!, keyPrefix, into);
    }
  });
}

/** Collect expand keys for every group that has children. */
export function initialExpandedKeys(items: ModuleRelation[], keyPrefix: string): Set<string> {
  const keys = new Set<string>();
  collectExpandedKeys(items, keyPrefix, keys);
  return keys;
}
