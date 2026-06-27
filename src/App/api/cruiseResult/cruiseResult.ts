import axios from 'axios'
import type { ICruiseResult } from 'dependency-cruiser'

export async function fetchCruiseResult(
  signal?: AbortSignal,
): Promise<ICruiseResult> {
  const { data } = await axios.get<ICruiseResult>('/cruise-result.json', {
    signal,
  })
  return data
}
