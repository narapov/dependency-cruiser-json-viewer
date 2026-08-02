/** Build a stable expand key for a nested child under its parent key prefix. */
export function keyPrefixForChild(parentExpandKey: string, childPath: string): string {
  if (parentExpandKey.startsWith('hidden:')) {
    return `hidden:${childPath}`;
  }
  return childPath;
}
