import { describe, expect, it } from 'vitest';

import {
  createDependencyRelationFlags,
  finalizeDependencyRelationFlags,
  mergeDependencyRelationFlags,
} from './mergeDependencyRelationFlags';

describe('createDependencyRelationFlags', () => {
  it('creates flags for a plain value dependency', () => {
    expect(createDependencyRelationFlags(false, false)).toEqual({
      typeOnly: false,
      valueCircular: false,
      typeOnlyCircular: false,
    });
  });

  it('creates flags for a type-only dependency', () => {
    expect(createDependencyRelationFlags(true, false)).toEqual({
      typeOnly: true,
      valueCircular: false,
      typeOnlyCircular: false,
    });
  });

  it('creates flags for a value circular dependency', () => {
    expect(createDependencyRelationFlags(false, true)).toEqual({
      typeOnly: false,
      valueCircular: true,
      typeOnlyCircular: false,
    });
  });

  it('creates flags for a type-only circular dependency', () => {
    expect(createDependencyRelationFlags(true, true)).toEqual({
      typeOnly: true,
      valueCircular: false,
      typeOnlyCircular: true,
    });
  });
});

describe('mergeDependencyRelationFlags', () => {
  it('keeps typeOnly only when every merge is type-only', () => {
    const flags = createDependencyRelationFlags(true, false);

    mergeDependencyRelationFlags(flags, true, false);
    expect(flags.typeOnly).toBe(true);

    mergeDependencyRelationFlags(flags, false, false);
    expect(flags.typeOnly).toBe(false);
  });

  it('sets valueCircular for circular value imports', () => {
    const flags = createDependencyRelationFlags(true, false);

    mergeDependencyRelationFlags(flags, false, true);

    expect(flags).toEqual({
      typeOnly: false,
      valueCircular: true,
      typeOnlyCircular: false,
    });
  });

  it('sets typeOnlyCircular for circular type-only imports', () => {
    const flags = createDependencyRelationFlags(true, false);

    mergeDependencyRelationFlags(flags, true, true);

    expect(flags).toEqual({
      typeOnly: true,
      valueCircular: false,
      typeOnlyCircular: true,
    });
  });
});

describe('finalizeDependencyRelationFlags', () => {
  it('clears typeOnlyCircular when valueCircular is set', () => {
    const flags = {
      typeOnly: false,
      valueCircular: true,
      typeOnlyCircular: true,
    };

    finalizeDependencyRelationFlags(flags);

    expect(flags.typeOnlyCircular).toBe(false);
  });

  it('leaves typeOnlyCircular when there is no value circular', () => {
    const flags = {
      typeOnly: true,
      valueCircular: false,
      typeOnlyCircular: true,
    };

    finalizeDependencyRelationFlags(flags);

    expect(flags.typeOnlyCircular).toBe(true);
  });
});
