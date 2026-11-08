// @vitest-environment jsdom
import { createRef, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fireEvent, renderHook, screen } from '@testing-library/react';
import { ReactFlowProvider } from '@xyflow/react';

import { buildCruiseSnapshot } from '@/domain';
import { renderWithTheme } from '@/testsUtils';

import { initialWorkspaceState, useWorkspaceStore } from '../../../../stores/workspaceStore';
import type { DependencyGraphHandle } from '../../types';
import { GraphCanvas } from './GraphCanvas';

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

const reactFlowGraphState: {
  nodes: Array<{
    id: string;
    type: string;
    position: { x: number; y: number };
    data: Record<string, unknown>;
  }>;
} = {
  nodes: [],
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

vi.mock('./helpers/routeEdgesWorker', () => ({
  runRouteEdgesInWorker: vi.fn(() => ({
    promise: Promise.resolve(new Map()),
    terminate: vi.fn(),
  })),
}));

vi.mock('./hooks', async importOriginal => {
  const actual = await importOriginal<typeof import('./hooks')>();
  return {
    ...actual,
    useBuildGraph: () => buildGraphState,
    useLayoutCache: () => ({
      layoutCacheRef: { current: new Map() },
      nodeLayoutsRevision: 0,
      commitRevision: 0,
      getLayoutCache: vi.fn(),
      requestRebuild: vi.fn(),
      bumpCommitRevision: vi.fn(),
    }),
    useCustomPositionedGraph: () => ({
      positionedNodes: new Map(),
      routableEdges: [],
      routingProgress: null,
      hasUserLayout: false,
      applyNodePositionToCache: vi.fn(),
      getLayoutSnapshot: () => ({ nodeLayouts: {} }),
      onAutoLayoutGroup: vi.fn(),
      onAutoLayoutGroupRecursive: vi.fn(),
    }),
    useReactFlowGraph: () => ({
      nodes: reactFlowGraphState.nodes,
      onNodesChange: vi.fn(),
      onNodeDrag: vi.fn(),
      onNodeDragStop: vi.fn(),
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
  promptFolderLevel: vi.fn(() => Promise.resolve(null)),
};

function renderGraphCanvas(ui: ReactNode) {
  return renderWithTheme(<ReactFlowProvider>{ui}</ReactFlowProvider>);
}

function seedSelectedWorkspace() {
  useWorkspaceStore.setState({
    ...initialWorkspaceState,
    cruiseSnapshot: EMPTY_TREE,
    selectedFilePaths: { 'src/a.ts': true },
    expandedFolderPaths: { src: true },
  });
}

describe('GraphCanvas', () => {
  beforeEach(() => {
    seedSelectedWorkspace();
  });

  afterEach(() => {
    buildGraphState.buildFailed = false;
    reactFlowGraphState.nodes = [];
    useWorkspaceStore.setState(initialWorkspaceState);
    vi.clearAllMocks();
  });

  it('toggles auto layout only switch', () => {
    const { result: i18n } = renderHook(() => useTranslation());
    renderGraphCanvas(<GraphCanvas {...baseProps} />);

    fireEvent.click(screen.getByLabelText(i18n.current.t('graph.autoLayoutOnly')));

    expect(useWorkspaceStore.getState().graphSettings.autoLayoutOnly).toBe(false);
  });

  it('sets active path on node click', () => {
    renderGraphCanvas(<GraphCanvas {...baseProps} />);

    fireEvent.click(screen.getByText('click-node'));

    expect(useWorkspaceStore.getState().activePath).toBe('src/a.ts');
  });

  it('focusNode fits view when node exists', () => {
    const ref = createRef<DependencyGraphHandle>();

    renderGraphCanvas(<GraphCanvas ref={ref} {...baseProps} />);

    ref.current?.focusNode('src/a.ts');
    expect(fitView).toHaveBeenCalledWith({ nodes: [{ id: 'src/a.ts' }], padding: 0.5, duration: 300 });

    fitView.mockClear();
    ref.current?.focusNode('missing.ts');
    expect(fitView).not.toHaveBeenCalled();
  });

  it('exportDot downloads serialized graph.dot', () => {
    const ref = createRef<DependencyGraphHandle>();

    renderGraphCanvas(<GraphCanvas ref={ref} {...baseProps} />);

    ref.current?.exportDot();

    expect(downloadTextFile).toHaveBeenCalledWith(
      'graph.dot',
      expect.stringContaining('digraph {'),
      'text/vnd.graphviz',
    );
  });

  it('exportMermaid downloads serialized graph.mmd with node style classes', () => {
    const ref = createRef<DependencyGraphHandle>();
    reactFlowGraphState.nodes = [
      {
        id: 'src/a.ts',
        type: 'file',
        position: { x: 0, y: 0 },
        data: { label: 'a.ts', path: 'src/a.ts', circular: true },
      },
    ];

    renderGraphCanvas(<GraphCanvas ref={ref} {...baseProps} />);

    ref.current?.exportMermaid();

    expect(downloadTextFile).toHaveBeenCalledWith(
      'graph.mmd',
      expect.stringMatching(
        /%%\{init: \{'flowchart': \{'curve': 'basis'\}\}\}%%\nflowchart LR[\s\S]*classDef fileCircular/,
      ),
      'text/plain',
    );
  });

  it('openDotOnline opens Graphviz Online with serialized DOT', () => {
    const ref = createRef<DependencyGraphHandle>();

    renderGraphCanvas(<GraphCanvas ref={ref} {...baseProps} />);

    ref.current?.openDotOnline();

    expect(openGraphvizOnline).toHaveBeenCalledWith(expect.stringContaining('digraph {'));
  });

  it('shows build error snackbar and clears on close', () => {
    const { result: i18n } = renderHook(() => useTranslation());
    buildGraphState.buildFailed = true;

    renderGraphCanvas(<GraphCanvas {...baseProps} />);

    expect(screen.getByText(i18n.current.t('graph.buildError'))).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(clearBuildFailed).toHaveBeenCalled();
  });
});
