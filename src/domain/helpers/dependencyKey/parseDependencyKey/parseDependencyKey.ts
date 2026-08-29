/** Parse a canonical `source->target` dependency key into its endpoints. */
export function parseDependencyKey(key: string): { source: string; target: string } {
  const separatorIndex = key.indexOf('->');
  if (separatorIndex === -1) {
    return { source: key, target: '' };
  }
  return {
    source: key.slice(0, separatorIndex),
    target: key.slice(separatorIndex + 2),
  };
}
