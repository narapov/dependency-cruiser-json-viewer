import type { ModuleRelation } from '../../../types';

interface TreeNode {
  path: string;
  name: string;
  isFile: boolean;
  circular: boolean;
  typeOnly: boolean;
  typeOnlyCircular: boolean;
  children: Map<string, TreeNode>;
}

/** Merge leaf relation flags into an existing tree node. */
function applyLeafFlags(node: TreeNode, leaf: ModuleRelation): void {
  node.circular = node.circular || leaf.circular;
  node.typeOnly = node.typeOnly || leaf.typeOnly;
  node.typeOnlyCircular = node.typeOnlyCircular || leaf.typeOnlyCircular;
}

/** Insert a leaf relation into the path segment tree. */
function insertLeaf(root: Map<string, TreeNode>, leaf: ModuleRelation): void {
  const segments = leaf.path.split('/');

  segments.reduce<{ current: Map<string, TreeNode>; pathSoFar: string }>(
    ({ current, pathSoFar }, segment, i) => {
      const nextPath = i === 0 ? segment : `${pathSoFar}/${segment}`;
      const isFile = i === segments.length - 1;

      if (!current.has(segment)) {
        current.set(segment, {
          path: nextPath,
          name: segment,
          isFile,
          circular: false,
          typeOnly: false,
          typeOnlyCircular: false,
          children: new Map(),
        });
      }

      const node = current.get(segment)!;
      if (isFile) {
        node.isFile = true;
        applyLeafFlags(node, leaf);
      }

      return {
        current: node.children,
        pathSoFar: nextPath,
      };
    },
    { current: root, pathSoFar: '' },
  );
}

/** Roll child flags up onto a folder node. */
function rollupFlags(node: TreeNode): void {
  if (node.isFile && node.children.size === 0) {
    return;
  }

  [...node.children.values()].forEach(child => {
    rollupFlags(child);
    node.circular = node.circular || child.circular;
    node.typeOnly = node.typeOnly || child.typeOnly;
    node.typeOnlyCircular = node.typeOnlyCircular || child.typeOnlyCircular;
  });
}

/** Convert a tree node map into sorted ModuleRelation rows. */
function mapToRelations(nodes: Map<string, TreeNode>): ModuleRelation[] {
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
      const relation: ModuleRelation = {
        path: node.path,
        circular: node.circular,
        typeOnly: node.typeOnly,
        typeOnlyCircular: node.typeOnlyCircular,
      };

      if (node.isFile && node.children.size === 0) {
        return relation;
      }

      return {
        ...relation,
        children: mapToRelations(node.children),
      };
    });
}

/**
 * Build a nested path tree from flat leaf relations.
 * @example
 * buildRelationPathTree([
 *   { path: 'src/App/a.ts', circular: false, typeOnly: false, typeOnlyCircular: false },
 *   { path: 'src/domain/b.ts', circular: false, typeOnly: false, typeOnlyCircular: false },
 * ])
 * // → [{ path: 'src', children: [App…, domain…] }]
 */
export function buildRelationPathTree(leaves: ModuleRelation[]): ModuleRelation[] {
  if (leaves.length === 0) {
    return [];
  }

  const root = leaves.reduce((treeRoot, leaf) => {
    insertLeaf(treeRoot, leaf);
    return treeRoot;
  }, new Map<string, TreeNode>());

  [...root.values()].forEach(rollupFlags);
  return mapToRelations(root);
}
