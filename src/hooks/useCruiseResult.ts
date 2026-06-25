import { useQuery } from '@tanstack/react-query'
import { fetchCruiseResult } from '../api/cruiseResult'

export function useCruiseResult() {
  return useQuery({
    queryKey: ['cruise-result'],
    queryFn: ({ signal }) => fetchCruiseResult(signal),
    staleTime: Infinity,
  })
}
