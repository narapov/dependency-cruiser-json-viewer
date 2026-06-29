import axios from 'axios';
import type { ICruiseResult } from 'dependency-cruiser';

import { validateCruiseResult } from '../../../domain';

export async function fetchCruiseResult(signal?: AbortSignal): Promise<ICruiseResult> {
  const { data } = await axios.get<ICruiseResult>(`${import.meta.env.BASE_URL}cruise-result.json`, {
    signal,
  });
  return validateCruiseResult(data);
}
