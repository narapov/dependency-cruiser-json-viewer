import { describe, expect, it } from 'vitest';

import { layoutsHaveDifferentPanelSets, preserveSharedPanelSizes } from './preserveSharedPanelSizes';

describe('layoutsHaveDifferentPanelSets', () => {
  it('returns false for the same panel ids', () => {
    expect(layoutsHaveDifferentPanelSets({ sidebar: 20, graph: 80 }, { sidebar: 25, graph: 75 })).toBe(false);
  });

  it('returns true when a panel is added or removed', () => {
    expect(
      layoutsHaveDifferentPanelSets({ sidebar: 20, graph: 80 }, { sidebar: 15, graph: 50, dependencies: 35 }),
    ).toBe(true);
  });
});

describe('preserveSharedPanelSizes', () => {
  it('returns null when the panel set is unchanged', () => {
    expect(preserveSharedPanelSizes({ sidebar: 20, graph: 80 }, { sidebar: 25, graph: 75 })).toBeNull();
  });

  it('keeps sidebar from the previous layout when closing a right panel', () => {
    const previous = { sidebar: 15, graph: 50, dependencies: 35 };
    const next = { sidebar: 20, graph: 80 };

    expect(preserveSharedPanelSizes(previous, next)).toEqual({
      sidebar: 15,
      graph: 85,
    });
  });

  it('keeps sidebar from the previous layout when opening a right panel', () => {
    const previous = { sidebar: 20, graph: 80 };
    const next = { sidebar: 12, graph: 48, dependencies: 40 };

    expect(preserveSharedPanelSizes(previous, next)).toEqual({
      sidebar: 20,
      graph: 40,
      dependencies: 40,
    });
  });

  it('returns null when shared non-graph sizes already match', () => {
    const previous = { sidebar: 20, graph: 50, dependencies: 30 };
    const next = { sidebar: 20, graph: 80 };

    expect(preserveSharedPanelSizes(previous, next)).toBeNull();
  });

  it('returns null when graph is missing', () => {
    expect(preserveSharedPanelSizes({ sidebar: 100 }, { sidebar: 50, dependencies: 50 })).toBeNull();
  });
});
