import type { ModuleRelation } from '@/domain';

/** Count real file endpoints across a nested relation tree. */
export function countRelationLeaves(items: ModuleRelation[]): number {
  return items.reduce((sum, item) => {
    if (!item.children?.length) {
      return sum + 1;
    }
    return sum + countRelationLeaves(item.children);
  }, 0);
}
