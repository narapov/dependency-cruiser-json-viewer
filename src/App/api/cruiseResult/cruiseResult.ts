import axios from 'axios';
import type { ICruiseResult } from 'dependency-cruiser';

import { validateCruiseResult } from '@/domain';

/** Fetch and validate the cruise-result JSON served with the app. */
export async function fetchCruiseResult(
  signal?: AbortSignal,
  options?: { cacheBust?: boolean },
): Promise<ICruiseResult> {
  const { data } = await axios.get<ICruiseResult>(`${import.meta.env.BASE_URL}cruise-result.json`, {
    signal,
    params: options?.cacheBust ? { t: Date.now() } : undefined,
    headers: options?.cacheBust ? { 'Cache-Control': 'no-cache', Pragma: 'no-cache' } : undefined,
  });
  return validateCruiseResult(data);
}
