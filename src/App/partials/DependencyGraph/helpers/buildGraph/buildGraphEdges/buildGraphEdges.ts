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

export function buildGraphEdges(
  modules: readonly IModule[],
  selectedSet: Set<string>,
  expandedFolders: Set<string>,
  visibleNodeIds: Set<string>,
): Edge[] {
  const edgeBuildMap = new Map<string, EdgeBuildInfo>();

  for (const module of modules) {
    if (!selectedSet.has(module.source)) continue;

    for (const dep of module.dependencies) {
      const resolved = dep.resolved;
      if (!resolved || !selectedSet.has(resolved)) continue;

      const sourceRep = getVisibleRepresentative(module.source, selectedSet, expandedFolders, visibleNodeIds);
      const targetRep = getVisibleRepresentative(resolved, selectedSet, expandedFolders, visibleNodeIds);

      if (sourceRep === targetRep) continue;
      if (!visibleNodeIds.has(sourceRep) || !visibleNodeIds.has(targetRep)) continue;

      const edgeKey = `${sourceRep}->${targetRep}`;
      const isTypeOnly = isTypeOnlyDependency(dep);
      const isCircular = dep.circular === true;
      const existing = edgeBuildMap.get(edgeKey);

      if (!existing) {
        edgeBuildMap.set(edgeKey, {
          sourceRep,
          targetRep,
          ...createDependencyRelationFlags(isTypeOnly, isCircular),
        });
      } else {
        mergeDependencyRelationFlags(existing, isTypeOnly, isCircular);
      }
    }
  }

  const edges: Edge[] = [];

  for (const [edgeKey, info] of edgeBuildMap) {
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

    edges.push({
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
    });
  }

  return edges;
}
