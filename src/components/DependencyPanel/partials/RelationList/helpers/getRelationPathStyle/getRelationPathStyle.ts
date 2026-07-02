import type { CSSProperties } from 'react';

import type { ModuleRelation } from '@/domain';
import { CIRCULAR_EDGE_COLOR, TYPE_ONLY_CIRCULAR_EDGE_COLOR } from '@/Shared';

export function getRelationPathStyle(item: ModuleRelation): CSSProperties {
  if (item.circular) {
    return { color: CIRCULAR_EDGE_COLOR };
  }
  if (item.typeOnlyCircular) {
    return { color: TYPE_ONLY_CIRCULAR_EDGE_COLOR };
  }
  if (item.typeOnly) {
    return { textDecoration: 'underline dashed' };
  }
  return {};
}
