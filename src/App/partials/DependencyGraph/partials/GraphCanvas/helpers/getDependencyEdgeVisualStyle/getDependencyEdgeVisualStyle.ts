import {
  CIRCULAR_EDGE_COLOR,
  DEFAULT_EDGE_COLOR,
  ERROR_EDGE_COLOR,
  TYPE_ONLY_CIRCULAR_EDGE_COLOR,
  WARNING_EDGE_COLOR,
} from '@/Shared';

import type { DependencyEdgeData } from '../../types';

const TYPE_ONLY_EDGE_DASH = '6 4';

export interface DependencyEdgeVisualStyle {
  stroke: string;
  strokeWidth: number;
  strokeDasharray?: string;
  title: string;
  isCircular: boolean;
}

/** Resolve base stroke/title for a dependency edge from semantic data flags. */
export function getDependencyEdgeVisualStyle(
  source: string,
  target: string,
  data: DependencyEdgeData | undefined,
): DependencyEdgeVisualStyle {
  const typeOnly = data?.typeOnly === true;
  const valueCircular = data?.valueCircular === true;
  const typeOnlyCircular = data?.typeOnlyCircular === true;
  const couldNotResolve = data?.couldNotResolve === true;
  const severity = data?.severity;
  const ruleNames = data?.ruleNames ?? [];

  let stroke = DEFAULT_EDGE_COLOR;
  let strokeWidth = 1;
  if (couldNotResolve || severity === 'error') {
    stroke = ERROR_EDGE_COLOR;
    strokeWidth = 2;
  } else if (valueCircular) {
    stroke = CIRCULAR_EDGE_COLOR;
    strokeWidth = 2;
  } else if (typeOnlyCircular) {
    stroke = TYPE_ONLY_CIRCULAR_EDGE_COLOR;
    strokeWidth = 2;
  } else if (severity === 'warn') {
    stroke = WARNING_EDGE_COLOR;
    strokeWidth = 2;
  }

  const isCircular = valueCircular || typeOnlyCircular;
  const title = [
    `${source} → ${target}`,
    typeOnly && '(type-only)',
    isCircular && '(circular)',
    couldNotResolve && '(unresolved)',
    ruleNames.length > 0 && `(${ruleNames.join(', ')})`,
  ]
    .filter(Boolean)
    .join(' ');

  return {
    stroke,
    strokeWidth,
    ...(typeOnly ? { strokeDasharray: TYPE_ONLY_EDGE_DASH } : {}),
    title,
    isCircular,
  };
}

/** Whether active-path / user overlays must not replace the base edge color. */
export function isProtectedDependencyEdge(data: DependencyEdgeData | undefined): boolean {
  return (
    data?.valueCircular === true ||
    data?.typeOnlyCircular === true ||
    data?.couldNotResolve === true ||
    data?.severity === 'error' ||
    data?.severity === 'warn'
  );
}
