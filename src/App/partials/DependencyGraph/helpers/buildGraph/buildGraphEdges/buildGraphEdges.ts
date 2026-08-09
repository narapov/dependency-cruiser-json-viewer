import type { IModule } from 'dependency-cruiser';

import { MarkerType, type Edge } from '@xyflow/react';

import {
  createDependencyRelationFlags,
  finalizeDependencyRelationFlags,
  getVisibleRepresentative,
  isTypeOnlyDependency,
  mergeDependencyRelationFlags,
} from '@/domain';
import {
  CIRCULAR_EDGE_COLOR,
  DEFAULT_EDGE_COLOR,
  ERROR_EDGE_COLOR,
  TYPE_ONLY_CIRCULAR_EDGE_COLOR,
  WARNING_EDGE_COLOR,
} from '@/Shared';

import {
  createEdgeViolationFlags,
  mergeEdgeViolationFlags,
  type EdgeViolationFlags,
  type EdgeViolationSeverity,
} from './helpers/edgeViolationFlags';

const TYPE_ONLY_EDGE_DASH = '6 4';

interface EdgeBuildInfo {
  sourceRep: string;
  targetRep: string;
  typeOnly: boolean;
  valueCircular: boolean;
  typeOnlyCircular: boolean;
  couldNotResolve: boolean;
  severity: EdgeViolationSeverity | null;
  ruleNames: Set<string>;
}

interface EdgeCandidate {
  edgeKey: string;
  sourceRep: string;
  targetRep: string;
  isTypeOnly: boolean;
  isCircular: boolean;
  violations: EdgeViolationFlags;
}

function toReactFlowEdge(edgeKey: string, info: EdgeBuildInfo): Edge {
  finalizeDependencyRelationFlags(info);

  const { sourceRep, targetRep, typeOnly, valueCircular, typeOnlyCircular, couldNotResolve, severity } = info;
  const ruleNames = [...info.ruleNames].sort();

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

  const style: Edge['style'] = { stroke, strokeWidth };
  if (typeOnly) {
    style.strokeDasharray = TYPE_ONLY_EDGE_DASH;
  }

  const titleSuffix = typeOnly ? ' (type-only)' : '';
  const rulesSuffix = ruleNames.length > 0 ? ` (${ruleNames.join(', ')})` : '';

  return {
    id: edgeKey,
    type: 'dependency',
    source: sourceRep,
    target: targetRep,
    interactionWidth: 3,
    data: {
      title: `${sourceRep} → ${targetRep}${titleSuffix}${rulesSuffix}`,
      typeOnly,
      circular: valueCircular || typeOnlyCircular,
      couldNotResolve,
      severity: severity ?? undefined,
      ruleNames: ruleNames.length > 0 ? ruleNames : undefined,
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: stroke,
    },
    style,
  };
}

/** Aggregates module dependencies into React Flow edges between visible representatives. */
export function buildGraphEdges(
  modules: readonly IModule[],
  selectedSet: Set<string>,
  expandedFolders: Set<string>,
  visibleNodeIds: Set<string>,
): Edge[] {
  const edgeBuildMap = modules
    .filter(module => selectedSet.has(module.source))
    .flatMap(module =>
      module.dependencies
        .filter(
          (dep): dep is typeof dep & { resolved: string } => Boolean(dep.resolved) && selectedSet.has(dep.resolved),
        )
        .map(dep => {
          const sourceRep = getVisibleRepresentative(module.source, selectedSet, expandedFolders, visibleNodeIds);
          const targetRep = getVisibleRepresentative(dep.resolved, selectedSet, expandedFolders, visibleNodeIds);
          return {
            edgeKey: `${sourceRep}->${targetRep}`,
            sourceRep,
            targetRep,
            isTypeOnly: isTypeOnlyDependency(dep),
            isCircular: dep.circular === true,
            violations: createEdgeViolationFlags(dep),
          } satisfies EdgeCandidate;
        })
        .filter(
          candidate =>
            candidate.sourceRep !== candidate.targetRep &&
            visibleNodeIds.has(candidate.sourceRep) &&
            visibleNodeIds.has(candidate.targetRep),
        ),
    )
    .reduce((map, candidate) => {
      const existing = map.get(candidate.edgeKey);
      if (!existing) {
        map.set(candidate.edgeKey, {
          sourceRep: candidate.sourceRep,
          targetRep: candidate.targetRep,
          ...createDependencyRelationFlags(candidate.isTypeOnly, candidate.isCircular),
          couldNotResolve: candidate.violations.couldNotResolve,
          severity: candidate.violations.severity,
          ruleNames: new Set(candidate.violations.ruleNames),
        });
      } else {
        mergeDependencyRelationFlags(existing, candidate.isTypeOnly, candidate.isCircular);
        mergeEdgeViolationFlags(existing, candidate.violations);
      }
      return map;
    }, new Map<string, EdgeBuildInfo>());

  return [...edgeBuildMap.entries()].map(([edgeKey, info]) => toReactFlowEdge(edgeKey, info));
}
