/** Whether a path equals a folder or lies under it. */
export function isUnderFolder(filePath: string, folderPath: string): boolean {
  return filePath === folderPath || filePath.startsWith(`${folderPath}/`);
}
