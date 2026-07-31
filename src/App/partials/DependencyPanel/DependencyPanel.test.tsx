// @vitest-environment jsdom
import type { IModule } from 'dependency-cruiser';
import { useTranslation } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';

import { fireEvent, renderHook, screen } from '@testing-library/react';

import { renderWithTheme } from '@/testsUtils';

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
];

const selectedPaths = ['src/foo/a.ts', 'src/foo/b.ts', 'src/bar/c.ts'];

describe('DependencyPanel', () => {
  it('renders sections, relations, and wires header actions', () => {
    const { result: i18n } = renderHook(() => useTranslation());
    const onClose = vi.fn();
    const onShowInGraph = vi.fn();

    renderWithTheme(
      <DependencyPanel
        path="src/foo/a.ts"
        modules={modules}
        selectedPaths={selectedPaths}
        expandedKeys={[]}
        onClose={onClose}
        onShowInGraph={onShowInGraph}
      />,
    );

    expect(screen.getByText('src/foo/a.ts')).toBeInTheDocument();
    expect(screen.getByText(i18n.current.t('dependencyPanel.dependencies'))).toBeInTheDocument();
    expect(screen.getByText(i18n.current.t('dependencyPanel.dependents'))).toBeInTheDocument();
    expect(screen.getAllByText('src/foo/b.ts').length).toBeGreaterThan(0);
    expect(screen.getByText('src/bar/c.ts')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: i18n.current.t('actions.close') }));
    expect(onClose).toHaveBeenCalled();

    const showInGraphButtons = screen.getAllByRole('button', { name: i18n.current.t('actions.showInGraph') });
    fireEvent.click(showInGraphButtons[0]);
    expect(onShowInGraph).toHaveBeenCalledWith('src/foo/a.ts');
  });

  it('shows empty relation lists when there are no relations', () => {
    const { result: i18n } = renderHook(() => useTranslation());

    renderWithTheme(
      <DependencyPanel
        path="src/bar/c.ts"
        modules={[moduleAt('src/bar/c.ts')]}
        selectedPaths={['src/bar/c.ts']}
        expandedKeys={[]}
        onClose={vi.fn()}
        onShowInGraph={vi.fn()}
      />,
    );

    expect(screen.getAllByText(i18n.current.t('dependencyPanel.noDependencies'))).toHaveLength(2);
  });
});
