export interface HighlightColorGroup {
  color: string;
  keys: string[];
}

/**
 * Group user edge highlights by color.
 * Keys within each group are sorted; group order follows first appearance
 * of each color among the sorted keys.
 */
export function groupHighlightsByColor(highlights: ReadonlyMap<string, string>): HighlightColorGroup[] {
  const sortedKeys = [...highlights.keys()].sort((a, b) => a.localeCompare(b));
  const groupsByColor = new Map<string, string[]>();
  const groupOrder: string[] = [];

  sortedKeys.forEach(key => {
    const color = highlights.get(key);
    if (color === undefined) {
      return;
    }
    const existing = groupsByColor.get(color);
    if (existing) {
      existing.push(key);
      return;
    }
    groupsByColor.set(color, [key]);
    groupOrder.push(color);
  });

  return groupOrder.map(color => ({
    color,
    keys: groupsByColor.get(color) ?? [],
  }));
}
