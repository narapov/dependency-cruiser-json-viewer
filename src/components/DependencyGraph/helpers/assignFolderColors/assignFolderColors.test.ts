import { describe, expect, it } from 'vitest'
import {
  assignFolderColors,
  hueDistanceForTest,
  parsePastelHsl,
  type FolderColorMode,
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

function expectSiblingHueSeparation(colors: ReadonlyMap<string, string>, folderPath: string) {
  const siblings = getSiblings(folderPath, colors)
  const hues = [colors.get(folderPath)!, ...siblings.map((p) => colors.get(p)!)]
    .map((color) => parsePastelHsl(color)?.hue)
    .filter((hue): hue is number => hue != null)

  for (let i = 0; i < hues.length; i++) {
    for (let j = i + 1; j < hues.length; j++) {
      expect(hueDistanceForTest(hues[i], hues[j])).toBeGreaterThanOrEqual(25)
    }
  }
}

function expectParentChildHueSeparation(colors: ReadonlyMap<string, string>) {
  const parentColor = colors.get('src')
  const childColor = colors.get('src/lib')
  expect(parentColor).toBeDefined()
  expect(childColor).toBeDefined()

  const parentHue = parsePastelHsl(parentColor!)!.hue
  const childHue = parsePastelHsl(childColor!)!.hue
  expect(hueDistanceForTest(parentHue, childHue)).toBeGreaterThanOrEqual(40)
}

describe('assignFolderColors', () => {
  it('returns the same color for the same path across calls', () => {
    const first = assignFolderColors(SAMPLE_SOURCES, 'light')
    const second = assignFolderColors([...SAMPLE_SOURCES].reverse(), 'light')
    for (const path of first.keys()) {
      expect(second.get(path)).toBe(first.get(path))
    }
  })

  it.each<FolderColorMode>(['light', 'dark'])(
    'assigns different colors to sibling folders in %s mode',
    (mode) => {
      const colors = assignFolderColors(SAMPLE_SOURCES, mode)
      expectSiblingHueSeparation(colors, 'src/components')
    },
  )

  it.each<FolderColorMode>(['light', 'dark'])(
    'assigns child colors distinct from parent in %s mode',
    (mode) => {
      const colors = assignFolderColors(SAMPLE_SOURCES, mode)
      expectParentChildHueSeparation(colors)
    },
  )

  it('uses light pastel tones in light mode', () => {
    const colors = assignFolderColors(SAMPLE_SOURCES, 'light')
    for (const color of colors.values()) {
      const parsed = parsePastelHsl(color)
      expect(parsed).not.toBeNull()
      expect(parsed!.lightness).toBeGreaterThanOrEqual(94)
      expect(parsed!.saturation).toBeLessThanOrEqual(38)
    }
  })

  it('uses dark muted tones in dark mode', () => {
    const colors = assignFolderColors(SAMPLE_SOURCES, 'dark')
    for (const color of colors.values()) {
      const parsed = parsePastelHsl(color)
      expect(parsed).not.toBeNull()
      expect(parsed!.lightness).toBeGreaterThanOrEqual(16)
      expect(parsed!.lightness).toBeLessThanOrEqual(28)
      expect(parsed!.saturation).toBeLessThanOrEqual(40)
    }
  })

  it('keeps the same hue per path across light and dark modes', () => {
    const light = assignFolderColors(SAMPLE_SOURCES, 'light')
    const dark = assignFolderColors(SAMPLE_SOURCES, 'dark')
    for (const path of light.keys()) {
      const lightParsed = parsePastelHsl(light.get(path)!)
      const darkParsed = parsePastelHsl(dark.get(path)!)
      expect(lightParsed).not.toBeNull()
      expect(darkParsed).not.toBeNull()
      expect(darkParsed!.hue).toBe(lightParsed!.hue)
      expect(darkParsed!.lightness).toBeLessThan(lightParsed!.lightness)
    }
  })
})
