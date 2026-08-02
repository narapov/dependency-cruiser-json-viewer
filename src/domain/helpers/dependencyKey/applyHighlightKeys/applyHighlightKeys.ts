/** Applies highlight colors to the given dependency keys. */
export function applyHighlightKeys(
  prev: ReadonlyMap<string, string>,
  dependencyKeys: readonly string[],
  color: string | null,
): ReadonlyMap<string, string> {
  if (dependencyKeys.length === 0) {
    return prev;
  }

  return dependencyKeys.reduce((next, key) => {
    if (color == null) {
      next.delete(key);
    } else {
      next.set(key, color);
    }
    return next;
  }, new Map(prev));
}
