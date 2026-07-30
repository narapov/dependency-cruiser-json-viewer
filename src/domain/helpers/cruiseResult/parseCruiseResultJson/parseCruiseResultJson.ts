import type { ICruiseResult } from 'dependency-cruiser';
import { array, object, string } from 'zod';

/** Why cruise-result JSON parsing failed. */
export type CruiseResultParseErrorCode = 'invalidJson' | 'invalidFormat';

/** Error thrown when cruise-result JSON is invalid or has the wrong shape. */
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

/** Minimal Zod schema requiring a modules array on a cruise result. */
export const cruiseResultSchema = object({
  modules: array(cruiseModuleSchema),
}).loose();

/** Validate a parsed value as an ICruiseResult or throw CruiseResultParseError. */
export function validateCruiseResult(parsed: unknown): ICruiseResult {
  const result = cruiseResultSchema.safeParse(parsed);
  if (!result.success) {
    throw new CruiseResultParseError('invalidFormat');
  }

  return result.data as unknown as ICruiseResult;
}

/** Parse and validate cruise-result JSON text. */
export function parseCruiseResultJson(text: string): ICruiseResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch {
    throw new CruiseResultParseError('invalidJson');
  }

  return validateCruiseResult(parsed);
}
