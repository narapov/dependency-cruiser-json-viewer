import type { IModule } from 'dependency-cruiser';

import { MarkerType, type Edge } from '@xyflow/react';

import {
  createDependencyRelationFlags,
  finalizeDependencyRelationFlags,
  getVisibleRepresentative,
  isTypeOnlyDependency,
  mergeDependencyRelationFlags,
} from '@/domain';
import { CIRCULAR_EDGE_COLOR, DEFAULT_EDGE_COLOR, TYPE_ONLY_CIRCULAR_EDGE_COLOR } from '@/Shared';

const TYPE_ONLY_EDGE_DASH = '6 4';

interface EdgeBuildInfo {
  sourceRep: string;
  targetRep: string;
  typeOnly: boolean;
  valueCircular: boolean;
  typeOnlyCircular: boolean;
}

interface EdgeCandidate {
  edgeKey: string;
  sourceRep: string;
  targetRep: string;
  isTypeOnly: boolean;
  isCircular: boolean;
}

function toReactFlowEdge(edgeKey: string, info: EdgeBuildInfo): Edge {
  finalizeDependencyRelationFlags(info);

  const { sourceRep, targetRep, typeOnly, valueCircular, typeOnlyCircular } = info;

  let stroke = DEFAULT_EDGE_COLOR;
  let strokeWidth = 1;
  if (valueCircular) {
    stroke = CIRCULAR_EDGE_COLOR;
    strokeWidth = 2;
  } else if (typeOnlyCircular) {
    stroke = TYPE_ONLY_CIRCULAR_EDGE_COLOR;
    strokeWidth = 2;
  }

  const style: Edge['style'] = { stroke, strokeWidth };
  if (typeOnly) {
    style.strokeDasharray = TYPE_ONLY_EDGE_DASH;
  }

  const titleSuffix = typeOnly ? ' (type-only)' : '';

  return {
    id: edgeKey,
    type: 'dependency',
    source: sourceRep,
    target: targetRep,
    interactionWidth: 3,
    data: {
      title: `${sourceRep} → ${targetRep}${titleSuffix}`,
      typeOnly,
      circular: valueCircular || typeOnlyCircular,
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
        });
      } else {
        mergeDependencyRelationFlags(existing, candidate.isTypeOnly, candidate.isCircular);
      }
      return map;
    }, new Map<string, EdgeBuildInfo>());

  return [...edgeBuildMap.entries()].map(([edgeKey, info]) => toReactFlowEdge(edgeKey, info));
}
