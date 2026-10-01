// @vitest-environment jsdom

import type { ICruiseResult, IModule, ISummary } from 'dependency-cruiser';
import { useTranslation } from 'react-i18next';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fireEvent, renderHook, screen } from '@testing-library/react';

import { buildCruiseSnapshot, buildCruiseSnapshotFromResult } from '@/domain';
import { copyToClipboard } from '@/Shared';
import { renderWithTheme } from '@/testsUtils';

import { initialWorkspaceState, useWorkspaceStore } from '../../stores/workspaceStore';
import { CircularPanel } from './CircularPanel';

vi.mock('@/Shared', async importOriginal => {
  const actual = await importOriginal<typeof import('@/Shared')>();
  return {
    ...actual,
    copyToClipboard: vi.fn(() => Promise.resolve()),
  };
});

function moduleAt(source: string, dependencies: IModule['dependencies'] = []): IModule {
  return { source, dependencies, dependents: [], valid: true };
}

function circularDep(resolved: string, cycleNames: string[]): IModule['dependencies'][0] {
  return {
    resolved,
    circular: true,
    cycle: cycleNames.map(name => ({ name, dependencyTypes: ['local'] })),
  } as IModule['dependencies'][0];
}

function cruiseResult(modules: IModule[]): ICruiseResult {
  return {
    modules,
    summary: {
      totalCruised: modules.length,
      violations: [],
      error: 0,
      warn: 0,
      info: 0,
      ignore: 0,
      optionsUsed: { args: '' },
      environment: {} as ISummary['environment'],
    },
  } as ICruiseResult;
}

const modulesWithCycles: IModule[] = [
  moduleAt('src/a.ts', [circularDep('src/b.ts', ['src/b.ts', 'src/a.ts'])]),
  moduleAt('src/b.ts', [circularDep('src/a.ts', ['src/a.ts', 'src/b.ts'])]),
];

function renderPanel(
  cruiseSnapshot: ReturnType<typeof buildCruiseSnapshot>,
  handlers: { onShowCycle?: (paths: string[]) => void; onShowInGraph?: (path: string) => void } = {},
) {
  const { onShowCycle = vi.fn(), onShowInGraph = vi.fn() } = handlers;
  useWorkspaceStore.setState({
    ...initialWorkspaceState,
    cruiseSnapshot,
  });

  return renderWithTheme(<CircularPanel onShowCycle={onShowCycle} onShowInGraph={onShowInGraph} />);
}

describe('CircularPanel', () => {
  beforeEach(() => {
    useWorkspaceStore.setState({ ...initialWorkspaceState });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows empty state when there are no cycles', () => {
    const { result: i18n } = renderHook(() => useTranslation());

    renderPanel(buildCruiseSnapshot([moduleAt('src/a.ts')]));

    expect(screen.getByText(i18n.current.t('circular.empty'))).toBeInTheDocument();
  });

  it('lists cycles under without-ignored and calls onShowCycle with present paths', () => {
    const { result: i18n } = renderHook(() => useTranslation());
    const onShowCycle = vi.fn();

    renderPanel(buildCruiseSnapshot(modulesWithCycles), { onShowCycle });

    expect(screen.getByText(`${i18n.current.t('circular.withoutIgnored')} (1)`)).toBeInTheDocument();
    expect(screen.getByText('b.ts → a.ts')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: i18n.current.t('circular.showCycle') }));
    expect(onShowCycle).toHaveBeenCalledWith(['src/b.ts', 'src/a.ts']);
  });

  it('expands cycle members with full paths', () => {
    const { result: i18n } = renderHook(() => useTranslation());

    renderPanel(buildCruiseSnapshot(modulesWithCycles));

    expect(screen.queryByText('src/b.ts')).not.toBeInTheDocument();
    expect(screen.queryByText('src/a.ts')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: i18n.current.t('actions.expand') }));

    expect(screen.getByText('src/b.ts')).toBeInTheDocument();
    expect(screen.getByText('src/a.ts')).toBeInTheDocument();
  });

  it('copies path and shows member in graph from expanded cycle', () => {
    const { result: i18n } = renderHook(() => useTranslation());
    const onShowInGraph = vi.fn();

    renderPanel(buildCruiseSnapshot(modulesWithCycles), { onShowInGraph });

    fireEvent.click(screen.getByRole('button', { name: i18n.current.t('actions.expand') }));

    const copyButtons = screen.getAllByRole('button', { name: i18n.current.t('actions.copyPath') });
    fireEvent.click(copyButtons[0]!);
    expect(copyToClipboard).toHaveBeenCalledWith('src/b.ts');

    const showButtons = screen.getAllByRole('button', { name: i18n.current.t('actions.showInGraph') });
    fireEvent.click(showButtons[0]!);
    expect(onShowInGraph).toHaveBeenCalledWith('src/b.ts');
  });

  it('keeps ignored members in the label and lists the cycle under with-ignored', () => {
    const { result: i18n } = renderHook(() => useTranslation());
    const snapshot = buildCruiseSnapshotFromResult(
      cruiseResult([
        moduleAt('src/a.ts', [circularDep('src/b.ts', ['src/b.ts', 'src/c.ts', 'src/d.ts', 'src/a.ts'])]),
        moduleAt('src/b.ts', [circularDep('src/c.ts', ['src/c.ts', 'src/d.ts', 'src/a.ts', 'src/b.ts'])]),
        moduleAt('src/c.ts', [circularDep('src/d.ts', ['src/d.ts', 'src/a.ts', 'src/b.ts', 'src/c.ts'])]),
        moduleAt('src/d.ts', [circularDep('src/a.ts', ['src/a.ts', 'src/b.ts', 'src/c.ts', 'src/d.ts'])]),
      ]),
      ['**/b.ts'],
    );
    const onShowCycle = vi.fn();

    renderPanel(snapshot, { onShowCycle });

    expect(screen.getByText(`${i18n.current.t('circular.withIgnored')} (1)`)).toBeInTheDocument();
    expect(screen.getByText(`b.ts (${i18n.current.t('circular.ignored')}) → c.ts → d.ts → a.ts`)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: i18n.current.t('circular.showCycle') }));
    expect(onShowCycle).toHaveBeenCalledWith(['src/c.ts', 'src/d.ts', 'src/a.ts']);
  });

  it('lists fully ignored cycles under fully-ignored and disables show cycle', () => {
    const { result: i18n } = renderHook(() => useTranslation());
    const snapshot = buildCruiseSnapshotFromResult(
      cruiseResult([
        moduleAt('src/keep.ts'),
        moduleAt('src/ignored/x.ts', [circularDep('src/ignored/y.ts', ['src/ignored/y.ts', 'src/ignored/x.ts'])]),
        moduleAt('src/ignored/y.ts', [circularDep('src/ignored/x.ts', ['src/ignored/x.ts', 'src/ignored/y.ts'])]),
      ]),
      ['src/ignored/**'],
    );

    renderPanel(snapshot);

    expect(screen.getByText(`${i18n.current.t('circular.fullyIgnored')} (1)`)).toBeInTheDocument();
    expect(screen.queryByText(`${i18n.current.t('circular.withIgnored')} (1)`)).not.toBeInTheDocument();
    expect(
      screen.getByText(`y.ts (${i18n.current.t('circular.ignored')}) → x.ts (${i18n.current.t('circular.ignored')})`),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: i18n.current.t('circular.showCycle') })).toBeDisabled();
  });

  it('splits clean, partial, and fully ignored cycles into sections', () => {
    const { result: i18n } = renderHook(() => useTranslation());
    const snapshot = buildCruiseSnapshotFromResult(
      cruiseResult([
        ...modulesWithCycles,
        moduleAt('src/p.ts', [circularDep('src/q.ts', ['src/q.ts', 'src/r.ts', 'src/p.ts'])]),
        moduleAt('src/q.ts', [circularDep('src/r.ts', ['src/r.ts', 'src/p.ts', 'src/q.ts'])]),
        moduleAt('src/r.ts', [circularDep('src/p.ts', ['src/p.ts', 'src/q.ts', 'src/r.ts'])]),
        moduleAt('src/ignored/x.ts', [circularDep('src/ignored/y.ts', ['src/ignored/y.ts', 'src/ignored/x.ts'])]),
        moduleAt('src/ignored/y.ts', [circularDep('src/ignored/x.ts', ['src/ignored/x.ts', 'src/ignored/y.ts'])]),
      ]),
      ['**/q.ts', 'src/ignored/**'],
    );

    renderPanel(snapshot);

    expect(screen.getByText(`${i18n.current.t('circular.withoutIgnored')} (1)`)).toBeInTheDocument();
    expect(screen.getByText(`${i18n.current.t('circular.withIgnored')} (1)`)).toBeInTheDocument();
    expect(screen.getByText(`${i18n.current.t('circular.fullyIgnored')} (1)`)).toBeInTheDocument();
    expect(screen.getByText('b.ts → a.ts')).toBeInTheDocument();
  });
});
