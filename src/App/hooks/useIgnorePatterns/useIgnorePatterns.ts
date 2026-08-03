import { useState } from 'react';

export function useIgnorePatterns() {
  const [patterns, setPatterns] = useState<string[]>([]);

  return { patterns, setPatterns };
}
