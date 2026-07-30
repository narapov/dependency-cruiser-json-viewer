/** Copy text to the system clipboard. */
export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}
