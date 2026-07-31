// @vitest-environment jsdom

import { useTranslation } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';

import { fireEvent, renderHook, screen } from '@testing-library/react';
import type { Edge } from '@xyflow/react';

import { renderWithTheme } from '@/testsUtils';

import { useEdgeContextMenu, type UseEdgeContextMenuOptions } from './useEdgeContextMenu';

const edge: Edge = { id: 'a->b', source: 'src/a.ts', target: 'src/b.ts' };

function EdgeContextMenuHarness(props: UseEdgeContextMenuOptions) {
  const { onEdgeContextMenu, edgeContextMenu } = useEdgeContextMenu(props);

  return (
    <>
      <button
        type="button"
        onContextMenu={event => {
          onEdgeContextMenu(event, edge);
        }}
      >
        edge-target
      </button>
      {edgeContextMenu}
    </>
  );
}

describe('useEdgeContextMenu', () => {
  it('opens menu with header and actions on context menu', () => {
    const { result: i18n } = renderHook(() => useTranslation());

    renderWithTheme(
      <EdgeContextMenuHarness onFocusNode={vi.fn()} getEdgeHighlight={vi.fn()} onSetUserEdgeHighlight={vi.fn()} />,
    );

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    fireEvent.contextMenu(screen.getByRole('button', { name: 'edge-target' }), {
      clientX: 12,
      clientY: 34,
    });

    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByText('src/a.ts')).toBeInTheDocument();
    expect(screen.getByText('src/b.ts')).toBeInTheDocument();
    expect(screen.getByText(i18n.current.t('graph.edgeMenu.viewSource'))).toBeInTheDocument();
    expect(screen.getByText(i18n.current.t('graph.edgeMenu.viewTarget'))).toBeInTheDocument();
    expect(screen.getByText(i18n.current.t('actions.highlight'))).toBeInTheDocument();
  });

  it('focuses source and closes menu', () => {
    const { result: i18n } = renderHook(() => useTranslation());
    const onFocusNode = vi.fn();

    renderWithTheme(
      <EdgeContextMenuHarness onFocusNode={onFocusNode} getEdgeHighlight={vi.fn()} onSetUserEdgeHighlight={vi.fn()} />,
    );

    fireEvent.contextMenu(screen.getByRole('button', { name: 'edge-target' }));
    fireEvent.click(screen.getByText(i18n.current.t('graph.edgeMenu.viewSource')));

    expect(onFocusNode).toHaveBeenCalledWith('src/a.ts');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('focuses target and closes menu', () => {
    const { result: i18n } = renderHook(() => useTranslation());
    const onFocusNode = vi.fn();

    renderWithTheme(
      <EdgeContextMenuHarness onFocusNode={onFocusNode} getEdgeHighlight={vi.fn()} onSetUserEdgeHighlight={vi.fn()} />,
    );

    fireEvent.contextMenu(screen.getByRole('button', { name: 'edge-target' }));
    fireEvent.click(screen.getByText(i18n.current.t('graph.edgeMenu.viewTarget')));

    expect(onFocusNode).toHaveBeenCalledWith('src/b.ts');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('sets edge highlight via submenu', () => {
    const { result: i18n } = renderHook(() => useTranslation());
    const onSetUserEdgeHighlight = vi.fn();

    renderWithTheme(
      <EdgeContextMenuHarness
        onFocusNode={vi.fn()}
        getEdgeHighlight={vi.fn()}
        onSetUserEdgeHighlight={onSetUserEdgeHighlight}
      />,
    );

    fireEvent.contextMenu(screen.getByRole('button', { name: 'edge-target' }));
    fireEvent.mouseEnter(screen.getByText(i18n.current.t('actions.highlight')));

    const colorItem = screen
      .getAllByRole('menuitem')
      .find(item => item.querySelector('[class*="MuiBox-root"]') && !item.textContent?.includes('Clear'));
    fireEvent.click(colorItem!);

    expect(onSetUserEdgeHighlight).toHaveBeenCalledWith('a->b', expect.any(String));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
