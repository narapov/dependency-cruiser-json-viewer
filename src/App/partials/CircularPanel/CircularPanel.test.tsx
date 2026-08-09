// @vitest-environment jsdom

import type { IModule } from 'dependency-cruiser';
import { useTranslation } from 'react-i18next';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { fireEvent, renderHook, screen } from '@testing-library/react';

import { copyToClipboard } from '@/Shared';
import { renderWithTheme } from '@/testsUtils';

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

const modulesWithCycles: IModule[] = [
  moduleAt('src/a.ts', [
    {
      resolved: 'src/b.ts',
      circular: true,
      cycle: [
        { name: 'src/b.ts', dependencyTypes: ['local'] },
        { name: 'src/a.ts', dependencyTypes: ['local'] },
      ],
    } as IModule['dependencies'][0],
  ]),
  moduleAt('src/b.ts', [
    {
      resolved: 'src/a.ts',
      circular: true,
      cycle: [
        { name: 'src/a.ts', dependencyTypes: ['local'] },
        { name: 'src/b.ts', dependencyTypes: ['local'] },
      ],
    } as IModule['dependencies'][0],
  ]),
];

describe('CircularPanel', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows empty state when there are no cycles', () => {
    const { result: i18n } = renderHook(() => useTranslation());

    renderWithTheme(
      <CircularPanel
        modules={[moduleAt('src/a.ts')]}
        sources={['src/a.ts']}
        onShowCycle={vi.fn()}
        onShowInGraph={vi.fn()}
      />,
    );

    expect(screen.getByText(i18n.current.t('circular.empty'))).toBeInTheDocument();
  });

  it('lists cycles and calls onShowCycle', () => {
    const { result: i18n } = renderHook(() => useTranslation());
    const onShowCycle = vi.fn();

    renderWithTheme(
      <CircularPanel
        modules={modulesWithCycles}
        sources={['src/a.ts', 'src/b.ts']}
        onShowCycle={onShowCycle}
        onShowInGraph={vi.fn()}
      />,
    );

    expect(screen.getByText('b.ts → a.ts')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: i18n.current.t('circular.showCycle') }));
    expect(onShowCycle).toHaveBeenCalledWith(['src/b.ts', 'src/a.ts']);
  });

  it('expands cycle members with full paths', () => {
    const { result: i18n } = renderHook(() => useTranslation());

    renderWithTheme(
      <CircularPanel
        modules={modulesWithCycles}
        sources={['src/a.ts', 'src/b.ts']}
        onShowCycle={vi.fn()}
        onShowInGraph={vi.fn()}
      />,
    );

    expect(screen.queryByText('src/b.ts')).not.toBeInTheDocument();
    expect(screen.queryByText('src/a.ts')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: i18n.current.t('actions.expand') }));

    expect(screen.getByText('src/b.ts')).toBeInTheDocument();
    expect(screen.getByText('src/a.ts')).toBeInTheDocument();
  });

  it('copies path and shows member in graph from expanded cycle', () => {
    const { result: i18n } = renderHook(() => useTranslation());
    const onShowInGraph = vi.fn();

    renderWithTheme(
      <CircularPanel
        modules={modulesWithCycles}
        sources={['src/a.ts', 'src/b.ts']}
        onShowCycle={vi.fn()}
        onShowInGraph={onShowInGraph}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: i18n.current.t('actions.expand') }));

    const copyButtons = screen.getAllByRole('button', { name: i18n.current.t('actions.copyPath') });
    fireEvent.click(copyButtons[0]!);
    expect(copyToClipboard).toHaveBeenCalledWith('src/b.ts');

    const showButtons = screen.getAllByRole('button', { name: i18n.current.t('actions.showInGraph') });
    fireEvent.click(showButtons[0]!);
    expect(onShowInGraph).toHaveBeenCalledWith('src/b.ts');
  });

  it('hides cycles whose paths are all outside sources', () => {
    const { result: i18n } = renderHook(() => useTranslation());

    renderWithTheme(
      <CircularPanel
        modules={modulesWithCycles}
        sources={['src/other.ts']}
        onShowCycle={vi.fn()}
        onShowInGraph={vi.fn()}
      />,
    );

    expect(screen.getByText(i18n.current.t('circular.empty'))).toBeInTheDocument();
  });
});
