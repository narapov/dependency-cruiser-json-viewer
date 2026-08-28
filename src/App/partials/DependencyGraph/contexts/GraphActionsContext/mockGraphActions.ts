import { vi } from 'vitest';

import type { GraphActionsContextValue } from './GraphActionsContext';

/** Creates mock graph action callbacks for component tests. */
export function createMockGraphActions(overrides: Partial<GraphActionsContextValue> = {}): GraphActionsContextValue {
  return {
    onToggleFolder: vi.fn(),
    onExpandRecursive: vi.fn(),
    onShowInFileTree: vi.fn(),
    onShowDependenciesPanel: vi.fn(),
    onHideOthers: vi.fn(),
    onShowDirectDependencies: vi.fn(),
    onShowDirectDependents: vi.fn(),
    ...overrides,
  };
}
