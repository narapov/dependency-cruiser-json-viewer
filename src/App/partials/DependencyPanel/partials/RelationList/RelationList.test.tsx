// @vitest-environment jsdom
import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider } from '@mui/material/styles';
import { fireEvent, render, renderHook, screen } from '@testing-library/react';

import type { ModuleRelation } from '@/domain';
import { muiTheme } from '@/Shared/styles/muiTheme';

import { RelationList } from './RelationList';

vi.mock('@/Shared', async importOriginal => {
  const actual = await importOriginal<typeof import('@/Shared')>();
  return {
    ...actual,
    copyToClipboard: vi.fn(() => Promise.resolve()),
  };
});

function renderWithTheme(ui: ReactElement) {
  return render(
    <ThemeProvider theme={muiTheme} defaultMode="light">
      {ui}
    </ThemeProvider>,
  );
}

const items: ModuleRelation[] = [
  { path: 'src/a.ts', circular: false, typeOnly: false, typeOnlyCircular: false },
  { path: 'src/b.ts', circular: true, typeOnly: false, typeOnlyCircular: false },
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

  it('renders items and invokes copy and show-in-graph', async () => {
    const { result: i18n } = renderHook(() => useTranslation());
    const onShowInGraph = vi.fn();
    const { copyToClipboard } = await import('@/Shared');

    renderWithTheme(<RelationList items={items} onShowInGraph={onShowInGraph} />);

    expect(screen.getByText('src/a.ts')).toBeInTheDocument();
    expect(screen.getByText('src/b.ts')).toBeInTheDocument();

    const copyButtons = screen.getAllByRole('button', { name: i18n.current.t('actions.copyPath') });
    fireEvent.click(copyButtons[0]);
    expect(copyToClipboard).toHaveBeenCalledWith('src/a.ts');

    const showButtons = screen.getAllByRole('button', { name: i18n.current.t('actions.showInGraph') });
    fireEvent.click(showButtons[1]);
    expect(onShowInGraph).toHaveBeenCalledWith('src/b.ts');
  });
});
