// @vitest-environment jsdom

import { useTranslation } from 'react-i18next';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { fireEvent, renderHook, screen } from '@testing-library/react';

import type { ModuleRelation } from '@/domain';
import { renderWithTheme } from '@/testsUtils';

import { RelationList } from './RelationList';

vi.mock('@/Shared', async importOriginal => {
  const actual = await importOriginal<typeof import('@/Shared')>();
  return {
    ...actual,
    copyToClipboard: vi.fn(() => Promise.resolve()),
  };
});

const items: ModuleRelation[] = [
  { path: 'src/a.ts', circular: false, typeOnly: false, typeOnlyCircular: false },
  { path: 'src/b.ts', circular: true, typeOnly: false, typeOnlyCircular: false },
];

const nested: ModuleRelation[] = [
  {
    path: 'src',
    circular: false,
    typeOnly: false,
    typeOnlyCircular: false,
    children: [
      {
        path: 'src/foo',
        circular: false,
        typeOnly: false,
        typeOnlyCircular: false,
        children: [
          { path: 'src/foo/a.ts', circular: false, typeOnly: false, typeOnlyCircular: false },
          { path: 'src/foo/b.ts', circular: true, typeOnly: false, typeOnlyCircular: false },
        ],
      },
    ],
  },
];

const hiddenItems: ModuleRelation[] = [
  {
    path: 'lib',
    circular: false,
    typeOnly: false,
    typeOnlyCircular: false,
    children: [
      {
        path: 'lib/vendor',
        circular: false,
        typeOnly: false,
        typeOnlyCircular: false,
        children: [{ path: 'lib/vendor/y.ts', circular: false, typeOnly: false, typeOnlyCircular: false }],
      },
    ],
  },
];

describe('RelationList', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows empty state when there are no items', () => {
    const { result: i18n } = renderHook(() => useTranslation());

    renderWithTheme(<RelationList items={[]} onShowInGraph={vi.fn()} />);

    expect(screen.getByText(i18n.current.t('dependencyPanel.noDependencies'))).toBeInTheDocument();
  });

  it('renders basenames and invokes copy and show-in-graph with full paths', async () => {
    const { result: i18n } = renderHook(() => useTranslation());
    const onShowInGraph = vi.fn();
    const { copyToClipboard } = await import('@/Shared');

    renderWithTheme(<RelationList items={items} onShowInGraph={onShowInGraph} />);

    expect(screen.getByText('a.ts')).toBeInTheDocument();
    expect(screen.getByText('b.ts')).toBeInTheDocument();

    const copyButtons = screen.getAllByRole('button', { name: i18n.current.t('actions.copyPath') });
    fireEvent.click(copyButtons[0]);
    expect(copyToClipboard).toHaveBeenCalledWith('src/a.ts');

    const showButtons = screen.getAllByRole('button', { name: i18n.current.t('actions.showInGraph') });
    fireEvent.click(showButtons[1]);
    expect(onShowInGraph).toHaveBeenCalledWith('src/b.ts');
  });

  it('expands nested path tree by default', () => {
    renderWithTheme(<RelationList items={nested} onShowInGraph={vi.fn()} />);

    expect(screen.getByText('src')).toBeInTheDocument();
    expect(screen.getByText('foo')).toBeInTheDocument();
    expect(screen.getByText('a.ts')).toBeInTheDocument();
    expect(screen.getByText('b.ts')).toBeInTheDocument();
  });

  it('shows hidden section and reveals nested items on expand', () => {
    const { result: i18n } = renderHook(() => useTranslation());

    renderWithTheme(<RelationList items={items} hiddenItems={hiddenItems} onShowInGraph={vi.fn()} />);

    expect(screen.getByText(i18n.current.t('dependencyPanel.hidden', { count: 1 }))).toBeInTheDocument();
    expect(screen.queryByText('vendor')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText(i18n.current.t('dependencyPanel.hidden', { count: 1 })));

    expect(screen.getByText('lib')).toBeInTheDocument();
    expect(screen.getByText('vendor')).toBeInTheDocument();
    expect(screen.getByText('y.ts')).toBeInTheDocument();
  });

  it('omits hidden section when there are no hidden items', () => {
    const { result: i18n } = renderHook(() => useTranslation());

    renderWithTheme(<RelationList items={items} hiddenItems={[]} onShowInGraph={vi.fn()} />);

    expect(screen.queryByText(i18n.current.t('dependencyPanel.hidden', { count: 0 }))).not.toBeInTheDocument();
  });
});
