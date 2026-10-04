// @vitest-environment jsdom
import { useTranslation } from 'react-i18next';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { renderHook, screen } from '@testing-library/react';

import { buildCruiseSnapshot } from '@/domain';
import { renderWithTheme } from '@/testsUtils';

import { initialWorkspaceState, useWorkspaceStore } from '../../stores/workspaceStore';
import { DependencyGraph } from './DependencyGraph';

vi.mock('./partials/GraphCanvas', () => ({
  GraphCanvas: () => <div data-testid="graph-canvas" />,
}));

const EMPTY_TREE = buildCruiseSnapshot([]);

const baseProps = {
  onShowInFileTree: vi.fn(),
  onViewModuleJson: vi.fn(),
  promptFolderLevel: vi.fn(() => Promise.resolve(null)),
};

function seedSelectedWorkspace() {
  useWorkspaceStore.setState({
    ...initialWorkspaceState,
    cruiseSnapshot: EMPTY_TREE,
    selectedFilePaths: { 'src/a.ts': true },
    expandedFolderPaths: { src: true },
  });
}

describe('DependencyGraph', () => {
  beforeEach(() => {
    seedSelectedWorkspace();
  });

  afterEach(() => {
    useWorkspaceStore.setState(initialWorkspaceState);
    vi.clearAllMocks();
  });

  it('shows empty selection when no paths are selected', () => {
    const { result: i18n } = renderHook(() => useTranslation());
    useWorkspaceStore.setState({ selectedFilePaths: {} });

    renderWithTheme(<DependencyGraph {...baseProps} />);

    expect(screen.getByText(i18n.current.t('graph.emptySelection'))).toBeInTheDocument();
    expect(screen.queryByTestId('graph-canvas')).not.toBeInTheDocument();
  });

  it('mounts graph canvas when paths are selected', () => {
    const { container } = renderWithTheme(<DependencyGraph {...baseProps} />);
    const root = container.firstChild as HTMLElement;

    expect(screen.getByTestId('graph-canvas')).toBeInTheDocument();
    expect(root.className).toMatch(/layoutLocked/);
  });

  it('drops layoutLocked class when auto layout only is off', () => {
    useWorkspaceStore.setState({
      graphSettings: {
        ...useWorkspaceStore.getState().graphSettings,
        autoLayoutOnly: false,
      },
    });

    const { container } = renderWithTheme(<DependencyGraph {...baseProps} />);
    const root = container.firstChild as HTMLElement;

    expect(root.className).not.toMatch(/layoutLocked/);
  });
});
