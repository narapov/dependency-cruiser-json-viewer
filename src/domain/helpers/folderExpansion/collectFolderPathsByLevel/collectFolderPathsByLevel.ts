import type { CruisePathNode } from '../../../types';

/** Folder paths to soft-expand for the given level budget (start consumes 1). */
export function collectFolderPathsToExpand(nodes: readonly CruisePathNode[], level: number): string[] {
  const paths: string[] = [];

  const visit = (node: CruisePathNode, remaining: number) => {
    if (!node.isFolder || remaining < 1) {
      return;
    }

    paths.push(node.path);
    node.children.values().forEach(child => {
      visit(child, remaining - 1);
    });
  };

  nodes.forEach(node => {
    visit(node, level);
  });

  return paths;
}

/** Folder paths to soft-collapse once the level budget is exhausted (start keeps `level` layers). */
export function collectFolderPathsToCollapse(nodes: readonly CruisePathNode[], level: number): string[] {
  const paths: string[] = [];

  const visit = (node: CruisePathNode, remaining: number) => {
    if (!node.isFolder) {
      return;
    }

    if (remaining < 1) {
      paths.push(node.path);
      node.children.values().forEach(child => {
        visit(child, 0);
      });
      return;
    }

    node.children.values().forEach(child => {
      visit(child, remaining - 1);
    });
  };

  nodes.forEach(node => {
    visit(node, level);
  });

  return paths;
}
