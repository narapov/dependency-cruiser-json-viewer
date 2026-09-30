// @vitest-environment jsdom
import { createRef, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fireEvent, renderHook, screen } from '@testing-library/react';

import { buildCruiseSnapshot } from '@/domain';
import { renderWithTheme } from '@/testsUtils';

import { initialWorkspaceState, useWorkspaceStore } from '../../stores/workspaceStore';
import { DependencyGraph } from './DependencyGraph';
import type { DependencyGraphHandle } from './types';

const fitView = vi.fn();
const getNode = vi.fn((id: string) => (id === 'src/a.ts' ? { id } : undefined));
const clearBuildFailed = vi.fn();
const { downloadTextFile, openGraphvizOnline } = vi.hoisted(() => ({
  downloadTextFile: vi.fn(),
  openGraphvizOnline: vi.fn(),
}));

const buildGraphState = {
  graphResult: { nodes: new Map(), tree: new Map(), edges: [] },
  isBuildingGraph: false,
  buildFailed: false,
  clearBuildFailed,
};

vi.mock('@/Shared', async importOriginal => {
  const actual = await importOriginal<typeof import('@/Shared')>();
  return {
    ...actual,
    downloadTextFile: (...args: unknown[]) => downloadTextFile(...args),
    openGraphvizOnline: (...args: unknown[]) => openGraphvizOnline(...args),
  };
});

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

vi.mock('./hooks', async importOriginal => {
  const actual = await importOriginal<typeof import('./hooks')>();
  return {
    ...actual,
    useBuildGraph: () => buildGraphState,
    useGraphLayoutNodes: () => ({
      nodes: [],
      onNodesChange: vi.fn(),
      onNodeDrag: vi.fn(),
      onNodeDragStop: vi.fn(),
      hasUserLayout: false,
      getLayoutSnapshot: () => ({ nodePositions: {} }),
      setLayoutSnapshot: vi.fn(),
    }),
    useHighlightedEdges: () => ({
      highlightedEdges: [],
      getEdgeHighlight: vi.fn(),
      setUserEdgeHighlight: vi.fn(),
      onEdgeClick: vi.fn(),
      selectEdge: vi.fn(),
      clearSelectedEdge: vi.fn(),
    }),
    useAutoFitView: vi.fn(),
    useEdgeContextMenu: () => ({ onEdgeContextMenu: vi.fn(), edgeContextMenu: null }),
  };
});

const EMPTY_TREE = buildCruiseSnapshot([]);

const baseProps = {
  onShowInFileTree: vi.fn(),
  onViewModuleJson: vi.fn(),
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
    buildGraphState.buildFailed = false;
    useWorkspaceStore.setState(initialWorkspaceState);
    vi.clearAllMocks();
  });

  it('shows empty selection when no paths are selected', () => {
    const { result: i18n } = renderHook(() => useTranslation());
    useWorkspaceStore.setState({ selectedFilePaths: {} });

    renderWithTheme(<DependencyGraph {...baseProps} />);

    expect(screen.getByText(i18n.current.t('graph.emptySelection'))).toBeInTheDocument();
    expect(screen.queryByTestId('react-flow')).not.toBeInTheDocument();
  });

  it('toggles auto layout only switch', () => {
    const { result: i18n } = renderHook(() => useTranslation());
    const { container } = renderWithTheme(<DependencyGraph {...baseProps} />);
    const root = container.firstChild as HTMLElement;

    expect(root.className).toMatch(/layoutLocked/);

    fireEvent.click(screen.getByLabelText(i18n.current.t('graph.autoLayoutOnly')));

    expect(useWorkspaceStore.getState().graphSettings.autoLayoutOnly).toBe(false);
    expect(root.className).not.toMatch(/layoutLocked/);
  });

  it('sets active path on node click', () => {
    renderWithTheme(<DependencyGraph {...baseProps} />);

    fireEvent.click(screen.getByText('click-node'));

    expect(useWorkspaceStore.getState().activePath).toBe('src/a.ts');
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

  it('exportDot downloads serialized graph.dot', () => {
    const ref = createRef<DependencyGraphHandle>();

    renderWithTheme(<DependencyGraph ref={ref} {...baseProps} />);

    ref.current?.exportDot();

    expect(downloadTextFile).toHaveBeenCalledWith(
      'graph.dot',
      expect.stringContaining('digraph {'),
      'text/vnd.graphviz',
    );
  });

  it('openDotOnline opens Graphviz Online with serialized DOT', () => {
    const ref = createRef<DependencyGraphHandle>();

    renderWithTheme(<DependencyGraph ref={ref} {...baseProps} />);

    ref.current?.openDotOnline();

    expect(openGraphvizOnline).toHaveBeenCalledWith(expect.stringContaining('digraph {'));
  });

  it('shows build error snackbar and clears on close', () => {
    const { result: i18n } = renderHook(() => useTranslation());
    buildGraphState.buildFailed = true;

    renderWithTheme(<DependencyGraph {...baseProps} />);

    expect(screen.getByText(i18n.current.t('graph.buildError'))).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(clearBuildFailed).toHaveBeenCalled();
  });
});
