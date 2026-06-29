import { matchesIgnorePattern } from '../matchesIgnorePattern';

export function isIgnoredPath(path: string, patterns: string[]): boolean {
  return patterns.some(pattern => matchesIgnorePattern(path, pattern));
}
