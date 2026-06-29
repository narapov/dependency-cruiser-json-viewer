export function formatShortcut(key: string): string {
  const isMac = navigator.platform.toUpperCase().includes('MAC');
  return isMac ? `⌘${key}` : `Ctrl+${key}`;
}
