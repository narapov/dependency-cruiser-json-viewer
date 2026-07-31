import { getParentPath, isUnderFolder } from '../../pathUtils';

function isFolderPath(path: string, sources: string[]): boolean {
  return sources.some(source => source.startsWith(`${path}/`));
}

function collectAncestorFoldersUnderRoot(source: string, folderPath: string, sources: string[]): string[] {
  const folders: string[] = [];
  let current = getParentPath(source);

  while (current && isUnderFolder(current, folderPath)) {
    if (isFolderPath(current, sources)) {
      folders.push(current);
    }
    if (current === folderPath) {
      break;
    }
    current = getParentPath(current);
  }

  return folders;
}

/** Folder paths in the subtree rooted at folderPath, including the root when it is a folder. */
export function getSubtreeFolderKeys(folderPath: string, sources: string[]): string[] {
  const root = isFolderPath(folderPath, sources) ? [folderPath] : [];
  const nested = sources
    .filter(source => isUnderFolder(source, folderPath) && source !== folderPath)
    .flatMap(source => collectAncestorFoldersUnderRoot(source, folderPath, sources));

  return [...new Set([...root, ...nested])];
}
