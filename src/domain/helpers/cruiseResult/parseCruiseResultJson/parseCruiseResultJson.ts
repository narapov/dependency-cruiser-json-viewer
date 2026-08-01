import type { ICruiseResult } from 'dependency-cruiser';
import { array, boolean, object, string, type ZodType } from 'zod';

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

/**
 * Runtime gate aligned with the required spine of {@link ICruiseResult} / {@link IModule}.
 *
 * Nested dependency and summary fields stay loose: dependency-cruiser's TypeScript types
 * (e.g. `IDependency.protocol`, `instability`) are stricter than real cruise JSON, and the
 * viewer only reads a few edge fields (`resolved`, `circular`, `dependencyTypes`).
 *
 * Canonical wire format (not used here — too heavy for the viewer load path):
 * https://github.com/sverweij/dependency-cruiser/blob/main/src/schema/cruise-result.schema.json
 */
export type CruiseResultGate = {
  modules: Array<{
    source: string;
    valid: boolean;
    dependencies: Array<Record<string, unknown>>;
    dependents: string[];
  }>;
  summary: Record<string, unknown>;
};

const cruiseDependencySchema = object({
  resolved: string().optional(),
  circular: boolean().optional(),
  dependencyTypes: array(string()).optional(),
}).loose();

const cruiseModuleSchema = object({
  source: string(),
  valid: boolean(),
  dependencies: array(cruiseDependencySchema),
  dependents: array(string()),
}).loose();

/** Structural Zod schema for cruise-result JSON consumed by the viewer. */
export const cruiseResultSchema = object({
  modules: array(cruiseModuleSchema),
  summary: object({}).loose(),
}).loose() satisfies ZodType<CruiseResultGate>;

/** Validate a parsed value as an ICruiseResult or throw CruiseResultParseError. */
export function validateCruiseResult(parsed: unknown): ICruiseResult {
  const result = cruiseResultSchema.safeParse(parsed);
  if (!result.success) {
    throw new CruiseResultParseError('invalidFormat');
  }

  // Full ICruiseResult / IDependency cannot be mirrored in Zod without rejecting real cruise exports.
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
