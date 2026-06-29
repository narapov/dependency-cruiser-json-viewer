import type { ICruiseResult } from 'dependency-cruiser';
import { array, object, string } from 'zod';

export type CruiseResultParseErrorCode = 'invalidJson' | 'invalidFormat';

export class CruiseResultParseError extends Error {
  readonly code: CruiseResultParseErrorCode;

  constructor(code: CruiseResultParseErrorCode) {
    super(code);
    this.name = 'CruiseResultParseError';
    this.code = code;
  }
}

const cruiseModuleSchema = object({
  source: string(),
}).loose();

export const cruiseResultSchema = object({
  modules: array(cruiseModuleSchema),
}).loose();

export function validateCruiseResult(parsed: unknown): ICruiseResult {
  const result = cruiseResultSchema.safeParse(parsed);
  if (!result.success) {
    throw new CruiseResultParseError('invalidFormat');
  }

  return result.data as unknown as ICruiseResult;
}

export function parseCruiseResultJson(text: string): ICruiseResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch {
    throw new CruiseResultParseError('invalidJson');
  }

  return validateCruiseResult(parsed);
}
