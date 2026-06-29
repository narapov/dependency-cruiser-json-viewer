import type { ICruiseResult } from 'dependency-cruiser';
import { describe, expect, it } from 'vitest';

import { CruiseResultParseError, parseCruiseResultJson, validateCruiseResult } from './parseCruiseResultJson';

const validResult: ICruiseResult = {
  modules: [{ source: 'src/index.ts', dependencies: [], dependents: [], valid: true }],
  summary: {
    totalCruised: 1,
    violations: [],
    error: 0,
    warn: 0,
    info: 0,
    ignore: 0,
    optionsUsed: { args: '' },
  },
} as ICruiseResult;

describe('parseCruiseResultJson', () => {
  it('parses valid cruise result JSON', () => {
    expect(parseCruiseResultJson(JSON.stringify(validResult))).toEqual(validResult);
  });

  it('throws invalidJson for malformed JSON', () => {
    expect(() => parseCruiseResultJson('{ not json')).toThrow(CruiseResultParseError);
    try {
      parseCruiseResultJson('{ not json');
    } catch (error) {
      expect(error).toBeInstanceOf(CruiseResultParseError);
      expect((error as CruiseResultParseError).code).toBe('invalidJson');
    }
  });

  it('throws invalidFormat when modules is missing', () => {
    expect(() => parseCruiseResultJson(JSON.stringify({ summary: {} }))).toThrow(CruiseResultParseError);
    try {
      parseCruiseResultJson(JSON.stringify({ summary: {} }));
    } catch (error) {
      expect((error as CruiseResultParseError).code).toBe('invalidFormat');
    }
  });

  it('throws invalidFormat when a module has no source', () => {
    expect(() => parseCruiseResultJson(JSON.stringify({ modules: [{ dependencies: [] }] }))).toThrow(
      CruiseResultParseError,
    );
  });
});

describe('validateCruiseResult', () => {
  it('accepts valid cruise result object', () => {
    expect(validateCruiseResult(validResult)).toEqual(validResult);
  });

  it('throws invalidFormat when modules is missing', () => {
    expect(() => validateCruiseResult({ summary: {} })).toThrow(CruiseResultParseError);
    try {
      validateCruiseResult({ summary: {} });
    } catch (error) {
      expect((error as CruiseResultParseError).code).toBe('invalidFormat');
    }
  });

  it('throws invalidFormat when a module has no source', () => {
    expect(() => validateCruiseResult({ modules: [{ dependencies: [] }] })).toThrow(CruiseResultParseError);
  });
});
