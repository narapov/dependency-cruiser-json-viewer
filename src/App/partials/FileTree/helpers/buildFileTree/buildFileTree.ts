import type { TreeNodeData } from '../../types';

interface TreeNode {
  name: string;
  path: string;
  children: Map<string, TreeNode>;
  isFile: boolean;
}

/** Builds a nested file tree from flat source paths, folders before files. */
export function buildFileTree(sources: string[]): TreeNodeData[] {
  const root = sources.reduce((treeRoot, source) => {
    const segments = source.split('/');

    segments.reduce<{ current: Map<string, TreeNode>; pathSoFar: string }>(
      ({ current, pathSoFar }, segment, i) => {
        const nextPath = i === 0 ? segment : `${pathSoFar}/${segment}`;
        const isFile = i === segments.length - 1;

        if (!current.has(segment)) {
          current.set(segment, {
            name: segment,
            path: nextPath,
            children: new Map(),
            isFile,
          });
        }

        return {
          current: current.get(segment)!.children,
          pathSoFar: nextPath,
        };
      },
      { current: treeRoot, pathSoFar: '' },
    );

    return treeRoot;
  }, new Map<string, TreeNode>());

  return mapToTreeData(root);
}

function mapToTreeData(nodes: Map<string, TreeNode>): TreeNodeData[] {
  return [...nodes.values()]
    .sort((a, b) => {
      const aIsDir = !a.isFile;
      const bIsDir = !b.isFile;
      if (aIsDir !== bIsDir) {
        return aIsDir ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    })
    .map(node => {
      if (node.isFile) {
        return {
          key: node.path,
          title: node.name,
        };
      }

      return {
        key: node.path,
        title: node.name,
        children: mapToTreeData(node.children),
      };
    });
}
