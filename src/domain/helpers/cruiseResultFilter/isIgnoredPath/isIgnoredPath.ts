import { matchesIgnorePattern } from '../matchesIgnorePattern';

/** Whether a path matches any of the given ignore patterns. */
export function isIgnoredPath(path: string, patterns: string[]): boolean {
  return patterns.some(pattern => matchesIgnorePattern(path, pattern));
}
