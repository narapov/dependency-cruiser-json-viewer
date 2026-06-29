export function toggleExpandedKey(keys: string[], path: string): string[] {
  return keys.includes(path) ? keys.filter(key => key !== path) : [...keys, path];
}
