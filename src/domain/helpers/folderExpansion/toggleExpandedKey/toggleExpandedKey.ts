/** Add or remove a path from an expanded-keys list. */
export function toggleExpandedKey(keys: string[], path: string): string[] {
  return keys.includes(path) ? keys.filter(key => key !== path) : [...keys, path];
}
