interface FormatShortcutOptions {
  shift?: boolean;
}

/** Format a keyboard shortcut with ⌘ on Mac or Ctrl+ elsewhere. */
export function formatShortcut(key: string, options?: FormatShortcutOptions): string {
  const isMac = navigator.platform.toUpperCase().includes('MAC');
  if (options?.shift) {
    return isMac ? `⇧⌘${key}` : `Ctrl+Shift+${key}`;
  }
  return isMac ? `⌘${key}` : `Ctrl+${key}`;
}
