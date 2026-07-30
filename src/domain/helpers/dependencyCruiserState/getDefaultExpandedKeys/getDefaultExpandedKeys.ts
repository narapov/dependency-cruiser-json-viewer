/** Default expanded folders: `src` when present in the cruise sources. */
export function getDefaultExpandedKeys(sources: string[]): string[] {
  const hasSrc = sources.some(source => source === 'src' || source.startsWith('src/'));
  return hasSrc ? ['src'] : [];
}
