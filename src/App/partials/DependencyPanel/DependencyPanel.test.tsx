// @vitest-environment jsdom
import type { IModule } from 'dependency-cruiser';
import { useTranslation } from 'react-i18next';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fireEvent, renderHook, screen } from '@testing-library/react';

import { buildCruiseSnapshot } from '@/domain';
import { renderWithTheme } from '@/testsUtils';

import { CruiseSnapshotProvider } from '../../contexts';
import { initialWorkspaceState, pathsToPresenceRecord, useWorkspaceStore } from '../../stores/workspaceStore';
import { DependencyPanel } from './DependencyPanel';

vi.mock('@/Shared', async importOriginal => {
  const actual = await importOriginal<typeof import('@/Shared')>();
  return {
    ...actual,
    copyToClipboard: vi.fn(() => Promise.resolve()),
  };
});

function moduleAt(source: string, dependencies: IModule['dependencies'] = []): IModule {
  return { source, dependencies, dependents: [], valid: true } as IModule;
}

const modules = [
  moduleAt('src/foo/a.ts', [
    { resolved: 'src/foo/b.ts', circular: true } as IModule['dependencies'][0],
    { resolved: 'src/bar/c.ts' } as IModule['dependencies'][0],
  ]),
  moduleAt('src/foo/b.ts', [{ resolved: 'src/foo/a.ts', circular: true } as IModule['dependencies'][0]]),
  moduleAt('src/bar/c.ts'),
  moduleAt('lib/y.ts', [{ resolved: 'src/foo/a.ts' } as IModule['dependencies'][0]]),
];

const selectedPaths = ['src/foo/a.ts', 'src/foo/b.ts', 'src/bar/c.ts'];

function seedPanel(path: string, selected: string[], panelModules: IModule[] = modules) {
  const cruiseSnapshot = buildCruiseSnapshot(panelModules);
  useWorkspaceStore.setState({
    ...initialWorkspaceState,
    cruiseSnapshot,
    dependenciesPanelPath: path,
    selectedFilePaths: pathsToPresenceRecord(selected),
    expandedFolderPaths: {},
    userEdgeHighlights: new Map(),
  });
  return cruiseSnapshot;
}

describe('DependencyPanel', () => {
  beforeEach(() => {
    useWorkspaceStore.setState({ ...initialWorkspaceState });
  });

  it('renders sections, nested relations, and wires header actions', () => {
    const { result: i18n } = renderHook(() => useTranslation());
    const onClose = vi.fn();
    const onShowInGraph = vi.fn();
    const onViewModuleJson = vi.fn();
    const cruiseSnapshot = seedPanel('src/foo/a.ts', selectedPaths);

    renderWithTheme(
      <CruiseSnapshotProvider value={cruiseSnapshot}>
        <DependencyPanel onClose={onClose} onShowInGraph={onShowInGraph} onViewModuleJson={onViewModuleJson} />
      </CruiseSnapshotProvider>,
    );

    expect(screen.getByText('src/foo/a.ts')).toBeInTheDocument();
    expect(screen.getByText(i18n.current.t('dependencyPanel.dependencies'))).toBeInTheDocument();
    expect(screen.getByText(i18n.current.t('dependencyPanel.dependents'))).toBeInTheDocument();
    expect(screen.getAllByText('b.ts').length).toBeGreaterThan(0);
    expect(screen.getByText('c.ts')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: i18n.current.t('actions.close') }));
    expect(onClose).toHaveBeenCalled();

    const showInGraphButtons = screen.getAllByRole('button', { name: i18n.current.t('actions.showInGraph') });
    fireEvent.click(showInGraphButtons[0]!);
    expect(onShowInGraph).toHaveBeenCalledWith('src/foo/a.ts');

    fireEvent.click(screen.getByRole('button', { name: i18n.current.t('moduleJson.view') }));
    expect(onViewModuleJson).toHaveBeenCalledWith('src/foo/a.ts');
  });

  it('shows empty relation lists when there are no relations', () => {
    const { result: i18n } = renderHook(() => useTranslation());
    const cruiseSnapshot = seedPanel('src/bar/c.ts', ['src/bar/c.ts'], [moduleAt('src/bar/c.ts')]);

    renderWithTheme(
      <CruiseSnapshotProvider value={cruiseSnapshot}>
        <DependencyPanel onClose={vi.fn()} onShowInGraph={vi.fn()} onViewModuleJson={vi.fn()} />
      </CruiseSnapshotProvider>,
    );

    expect(screen.getAllByText(i18n.current.t('dependencyPanel.noDependencies'))).toHaveLength(2);
  });

  it('shows hidden dependents for unselected modules', () => {
    const { result: i18n } = renderHook(() => useTranslation());
    const cruiseSnapshot = seedPanel('src/foo/a.ts', selectedPaths);

    renderWithTheme(
      <CruiseSnapshotProvider value={cruiseSnapshot}>
        <DependencyPanel onClose={vi.fn()} onShowInGraph={vi.fn()} onViewModuleJson={vi.fn()} />
      </CruiseSnapshotProvider>,
    );

    expect(screen.getByText(i18n.current.t('dependencyPanel.hidden', { count: 1 }))).toBeInTheDocument();
    fireEvent.click(screen.getByText(i18n.current.t('dependencyPanel.hidden', { count: 1 })));
    expect(screen.getByText('y.ts')).toBeInTheDocument();
  });
});
