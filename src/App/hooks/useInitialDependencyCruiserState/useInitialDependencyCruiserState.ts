import { useMemo } from 'react'
import { getInitialDependencyCruiserState, type DependencyCruiserState } from '../../../domain'

export type { DependencyCruiserState }

export function useInitialDependencyCruiserState(sources: string[]): DependencyCruiserState {
  return useMemo(() => getInitialDependencyCruiserState(sources), [sources])
}
