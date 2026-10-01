import type { CSSProperties } from 'react';

import { DEFAULT_EDGE_COLOR } from '@/Shared';

/** True when edge is selected or stroke differs from DEFAULT_EDGE_COLOR (highlights/path/circular). */
export function isEdgeEmphasized(style: CSSProperties | undefined, selected: boolean | undefined): boolean {
  return !!selected || (!!style?.stroke && style.stroke !== DEFAULT_EDGE_COLOR);
}
