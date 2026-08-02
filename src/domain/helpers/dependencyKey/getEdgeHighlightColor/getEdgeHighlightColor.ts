/** Shared highlight color for dependency keys, or undefined if mixed or missing. */
export function getEdgeHighlightColor(
  dependencyKeys: readonly string[],
  userEdgeHighlights: ReadonlyMap<string, string>,
): string | undefined {
  if (dependencyKeys.length === 0) {
    return undefined;
  }

  const colors = dependencyKeys
    .map(key => userEdgeHighlights.get(key))
    .filter((color): color is string => color != null);

  if (colors.length === 0) {
    return undefined;
  }
  if (colors.every(color => color === colors[0])) {
    return colors[0];
  }
  return undefined;
}
