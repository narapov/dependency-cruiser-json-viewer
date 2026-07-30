import type { Node } from '@xyflow/react';

import { getBaseName } from '@/domain';

import { getLeafNodeSize } from '../../getLeafNodeSize';
import type { NodeSize } from '../types';

export function getLeafSizeForPath(path: string, visibleNodes: Map<string, 'folder' | 'file'>): NodeSize {
  const label = getBaseName(path);
  const kind = visibleNodes.get(path) === 'folder' ? 'folder' : 'file';

  return getLeafNodeSize(label, kind);
}

export function toNodeDimensions(size: NodeSize): Pick<Node, 'width' | 'height' | 'style'> {
  return {
    width: size.width,
    height: size.height,
    style: { width: size.width, height: size.height },
  };
}

export function applyNodeDimensions(node: Node, size: NodeSize): void {
  node.width = size.width;
  node.height = size.height;
  node.style = {
    ...node.style,
    width: size.width,
    height: size.height,
  };
}
