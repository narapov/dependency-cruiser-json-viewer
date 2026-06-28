import type { ICruiseResult, IModule } from 'dependency-cruiser'
import { describe, expect, it } from 'vitest'
import { countIgnoredModules } from './countIgnoredModules'

function moduleAt(source: string): IModule {
  return { source, dependencies: [], dependents: [], valid: true } as IModule
}

function cruiseResult(modules: IModule[]): ICruiseResult {
  return {
    modules,
    summary: { totalCruised: modules.length },
  } as ICruiseResult
}

describe('countIgnoredModules', () => {
  it('returns 0 when patterns are empty', () => {
    const result = cruiseResult([moduleAt('src/foo/a.test.ts')])

    expect(countIgnoredModules(result, [])).toBe(0)
  })

  it('counts modules matching glob patterns', () => {
    const result = cruiseResult([
      moduleAt('src/foo/a.ts'),
      moduleAt('src/foo/a.test.ts'),
      moduleAt('src/foo/b.spec.tsx'),
    ])

    expect(countIgnoredModules(result, ['**/*.test.ts', '**/*.spec.tsx'])).toBe(2)
  })
})
