import picomatch from 'picomatch';

type IgnoreMatcher = (path: string) => boolean;

/** Compile ignore glob patterns into reusable matchers, skipping empty and invalid ones. */
export function compileIgnoreMatchers(patterns: string[]): IgnoreMatcher[] {
  return patterns
    .map<IgnoreMatcher | null>(pattern => {
      const trimmed = pattern.trim();
      if (trimmed.length === 0) {
        return null;
      }

      try {
        return picomatch(trimmed);
      } catch {
        return null;
      }
    })
    .filter((matcher): matcher is IgnoreMatcher => !!matcher);
}
