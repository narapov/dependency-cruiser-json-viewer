import picomatch from 'picomatch';

/** Match a path against a single picomatch ignore pattern. */
export function matchesIgnorePattern(path: string, pattern: string): boolean {
  const trimmed = pattern.trim();
  if (trimmed.length === 0) {
    return false;
  }

  try {
    return picomatch(trimmed)(path);
  } catch {
    return false;
  }
}
