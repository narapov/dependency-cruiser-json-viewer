import { describe, expect, it } from 'vitest';

import type { ModuleRelation } from '@/domain';
import { CIRCULAR_EDGE_COLOR, TYPE_ONLY_CIRCULAR_EDGE_COLOR } from '@/Shared';

import { getRelationPathStyle } from './getRelationPathStyle';

function relation(overrides: Partial<ModuleRelation> = {}): ModuleRelation {
  return {
    path: 'src/a.ts',
    circular: false,
    typeOnly: false,
    typeOnlyCircular: false,
    ...overrides,
  };
}

describe('getRelationPathStyle', () => {
  it('returns circular color when circular', () => {
    expect(getRelationPathStyle(relation({ circular: true }))).toEqual({ color: CIRCULAR_EDGE_COLOR });
  });

  it('returns type-only circular color when typeOnlyCircular', () => {
    expect(getRelationPathStyle(relation({ typeOnlyCircular: true }))).toEqual({
      color: TYPE_ONLY_CIRCULAR_EDGE_COLOR,
    });
  });

  it('returns dashed underline when typeOnly', () => {
    expect(getRelationPathStyle(relation({ typeOnly: true }))).toEqual({
      textDecoration: 'underline dashed',
    });
  });

  it('prefers circular over typeOnly flags', () => {
    expect(
      getRelationPathStyle(
        relation({
          circular: true,
          typeOnly: true,
          typeOnlyCircular: true,
        }),
      ),
    ).toEqual({ color: CIRCULAR_EDGE_COLOR });
  });

  it('returns empty style for plain relations', () => {
    expect(getRelationPathStyle(relation())).toEqual({});
  });
});
