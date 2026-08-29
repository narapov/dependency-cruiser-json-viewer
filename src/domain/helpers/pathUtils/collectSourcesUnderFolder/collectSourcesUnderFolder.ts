import { isUnderFolder } from '../isUnderFolder';

/** Module sources that live strictly under a folder path. */
export function collectSourcesUnderFolder(folderPath: string, sources: readonly string[]): string[] {
  return sources.filter(source => isUnderFolder(source, folderPath) && source !== folderPath);
}
