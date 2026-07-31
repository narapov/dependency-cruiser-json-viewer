/** Clamp a width between inclusive min and max bounds. */
export function clampWidth(width: number, minWidth: number, maxWidth: number): number {
  return Math.min(Math.max(width, minWidth), maxWidth);
}
