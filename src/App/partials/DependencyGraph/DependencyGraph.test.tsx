// @vitest-environment jsdom
import { createRef, type ReactElement, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider } from '@mui/material/styles';
import { cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react';

import { muiTheme } from '@/Shared/styles/muiTheme';

import { DependencyGraph } from './DependencyGraph';
import type { DependencyGraphHandle } from './types';

const fitView = vi.fn();
const getNode = vi.fn((id: string) => (id === 'src/a.ts' ? { id } : undefined));

vi.mock('@xyflow/react', () => ({
  ReactFlowProvider: ({ children }: { children: ReactNode }) => children,
  ReactFlow: ({
    children,
    onNodeClick,
  }: {
    children?: ReactNode;
    onNodeClick?: (_: unknown, node: { id: string }) => void;
  }) => (
    <div data-testid="react-flow">
      <button type="button" onClick={() => onNodeClick?.({}, { id: 'src/a.ts' })}>
        click-node
      </button>
      {children}
    </div>
  ),
  Background: () => null,
  Controls: () => null,
  MiniMap: () => null,
  Panel: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  useReactFlow: () => ({ fitView, getNode }),
}));

vi.mock('./hooks', () => ({
  useBuildGraph: () => ({
    graphResult: { nodes: [], edges: [], visibleNodeIds: new Set<string>() },
    isBuildingGraph: false,
    buildFailed: false,
    clearBuildFailed: vi.fn(),
    expandedFolders: new Set<string>(),
  }),
  useGraphLayoutNodes: () => ({
    nodes: [],
    onNodesChange: vi.fn(),
    onNodeDrag: vi.fn(),
    onNodeDragStop: vi.fn(),
    hasUserLayout: false,
  }),
  useHighlightedNodes: () => ({ highlightedNodes: [] }),
  useHighlightedEdges: () => ({
    highlightedEdges: [],
    getEdgeHighlight: vi.fn(),
    setUserEdgeHighlight: vi.fn(),
    clearAllHighlights: vi.fn(),
    onEdgeClick: vi.fn(),
    clearSelectedEdge: vi.fn(),
  }),
  useAutoFitView: vi.fn(),
  useEdgeContextMenu: () => ({ onEdgeContextMenu: vi.fn(), edgeContextMenu: null }),
}));

function renderWithTheme(ui: ReactElement) {
  return render(
    <ThemeProvider theme={muiTheme} defaultMode="light">
      {ui}
    </ThemeProvider>,
  );
}

const baseProps = {
  modules: [],
  selectedPaths: ['src/a.ts'],
  expandedKeys: ['src'],
  onToggleFolder: vi.fn(),
  onExpandRecursive: vi.fn(),
  onShowInFileTree: vi.fn(),
};

describe('DependencyGraph', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('shows empty selection when no paths are selected', () => {
    const { result: i18n } = renderHook(() => useTranslation());

    renderWithTheme(<DependencyGraph {...baseProps} selectedPaths={[]} />);

    expect(screen.getByText(i18n.current.t('graph.emptySelection'))).toBeInTheDocument();
    expect(screen.queryByTestId('react-flow')).not.toBeInTheDocument();
  });

  it('toggles auto layout only switch', () => {
    const { result: i18n } = renderHook(() => useTranslation());
    const { container } = renderWithTheme(<DependencyGraph {...baseProps} />);
    const root = container.firstChild as HTMLElement;

    expect(root.className).toMatch(/layoutLocked/);

    fireEvent.click(screen.getByLabelText(i18n.current.t('graph.autoLayoutOnly')));

    expect(root.className).not.toMatch(/layoutLocked/);
  });

  it('notifies active path change on node click', () => {
    const onActivePathChange = vi.fn();

    renderWithTheme(<DependencyGraph {...baseProps} onActivePathChange={onActivePathChange} />);

    fireEvent.click(screen.getByText('click-node'));

    expect(onActivePathChange).toHaveBeenCalledWith('src/a.ts');
  });

  it('focusNode fits view when node exists', () => {
    const ref = createRef<DependencyGraphHandle>();

    renderWithTheme(<DependencyGraph ref={ref} {...baseProps} />);

    ref.current?.focusNode('src/a.ts');
    expect(fitView).toHaveBeenCalledWith({ nodes: [{ id: 'src/a.ts' }], padding: 0.5, duration: 300 });

    fitView.mockClear();
    ref.current?.focusNode('missing.ts');
    expect(fitView).not.toHaveBeenCalled();
  });
});
