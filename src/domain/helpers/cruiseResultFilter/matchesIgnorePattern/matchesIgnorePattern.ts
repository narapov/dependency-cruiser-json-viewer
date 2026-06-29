import picomatch from 'picomatch';

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
