import { useState } from 'react'
import { IGNORE_PATTERNS_STORAGE_KEY } from './ignorePatternsOptions'

function readStoredPatterns(): string[] {
  const stored = localStorage.getItem(IGNORE_PATTERNS_STORAGE_KEY)
  if (stored == null) {
    return []
  }

  try {
    const parsed: unknown = JSON.parse(stored)
    if (!Array.isArray(parsed)) {
      return []
    }
    return parsed.filter((item): item is string => typeof item === 'string')
  } catch {
    return []
  }
}

function writeStoredPatterns(patterns: string[]) {
  if (patterns.length === 0) {
    localStorage.removeItem(IGNORE_PATTERNS_STORAGE_KEY)
    return
  }

  localStorage.setItem(IGNORE_PATTERNS_STORAGE_KEY, JSON.stringify(patterns))
}

export function useIgnorePatterns() {
  const [patterns, setPatternsState] = useState(readStoredPatterns)

  const setPatterns = (nextPatterns: string[]) => {
    setPatternsState(nextPatterns)
    writeStoredPatterns(nextPatterns)
  }

  return { patterns, setPatterns }
}
