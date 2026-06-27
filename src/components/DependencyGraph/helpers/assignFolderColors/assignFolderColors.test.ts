import { describe, expect, it } from 'vitest'
import {
  assignFolderColors,
  hueDistanceForTest,
  parsePastelHsl,
} from './assignFolderColors'

const SAMPLE_SOURCES = [
  'src/App.tsx',
  'src/components/AppLayout.tsx',
  'src/components/DependencyGraph/DependencyGraph.tsx',
  'src/lib/buildFileTree.ts',
  'src/lib/assignFolderColors.ts',
  'src/lib/dependencyGraph/buildGraph.ts',
  'packages/foo/index.ts',
  'packages/bar/util.ts',
]

function getParentPath(path: string): string | null {
  const slash = path.lastIndexOf('/')
  return slash === -1 ? null : path.slice(0, slash)
}

function getSiblings(
  folderPath: string,
  colors: ReadonlyMap<string, string>,
): string[] {
  const parent = getParentPath(folderPath)
  const siblings: string[] = []
  for (const path of colors.keys()) {
    if (getParentPath(path) === parent && path !== folderPath) {
      siblings.push(path)
    }
  }
  return siblings
}

describe('assignFolderColors', () => {
  it('returns the same color for the same path across calls', () => {
    const first = assignFolderColors(SAMPLE_SOURCES)
    const second = assignFolderColors([...SAMPLE_SOURCES].reverse())
    for (const path of first.keys()) {
      expect(second.get(path)).toBe(first.get(path))
    }
  })

  it('assigns different colors to sibling folders', () => {
    const colors = assignFolderColors(SAMPLE_SOURCES)
    const siblings = getSiblings('src/components', colors)
    const hues = [colors.get('src/components')!, ...siblings.map((p) => colors.get(p)!)]
      .map((color) => parsePastelHsl(color)?.hue)
      .filter((hue): hue is number => hue != null)

    for (let i = 0; i < hues.length; i++) {
      for (let j = i + 1; j < hues.length; j++) {
        expect(hueDistanceForTest(hues[i], hues[j])).toBeGreaterThanOrEqual(25)
      }
    }
  })

  it('assigns child colors distinct from parent', () => {
    const colors = assignFolderColors(SAMPLE_SOURCES)
    const parentColor = colors.get('src')
    const childColor = colors.get('src/lib')
    expect(parentColor).toBeDefined()
    expect(childColor).toBeDefined()

    const parentHue = parsePastelHsl(parentColor!)!.hue
    const childHue = parsePastelHsl(childColor!)!.hue
    expect(hueDistanceForTest(parentHue, childHue)).toBeGreaterThanOrEqual(40)
  })

  it('uses light pastel tones only', () => {
    const colors = assignFolderColors(SAMPLE_SOURCES)
    for (const color of colors.values()) {
      const parsed = parsePastelHsl(color)
      expect(parsed).not.toBeNull()
      expect(parsed!.lightness).toBeGreaterThanOrEqual(94)
      expect(parsed!.saturation).toBeLessThanOrEqual(38)
    }
  })
})
