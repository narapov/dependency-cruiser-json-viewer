// @vitest-environment jsdom

import type { ICruiseResult, IModule } from 'dependency-cruiser';
import { useTranslation } from 'react-i18next';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fireEvent, renderHook, screen } from '@testing-library/react';

import { USER_EDGE_HIGHLIGHT_COLORS } from '@/Shared';
import { renderWithTheme } from '@/testsUtils';

import { initialWorkspaceState, useWorkspaceStore } from '../../stores/workspaceStore';
import { HighlightEdgeDialog } from './HighlightEdgeDialog';

function moduleAt(source: string, dependencies: IModule['dependencies'] = []): IModule {
  return { source, dependencies, dependents: [], valid: true } as IModule;
}

function seedModules(modules: IModule[]) {
  useWorkspaceStore.getState().reset(
    {
      modules,
      summary: {
        totalCruised: modules.length,
        violations: [],
        error: 0,
        warn: 0,
        info: 0,
        ignore: 0,
        advisedExitCode: 0,
        optionsUsed: { args: '' },
        environment: {} as ICruiseResult['summary']['environment'],
      },
    } as ICruiseResult,
    'hard',
  );
}

function renderDialog(modules: IModule[], onConfirm = vi.fn(), onClose = vi.fn()) {
  seedModules(modules);
  return renderWithTheme(<HighlightEdgeDialog open onConfirm={onConfirm} onClose={onClose} />);
}

describe('HighlightEdgeDialog', () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
    useWorkspaceStore.setState({ ...initialWorkspaceState });
  });

  it('walks source → target → color and confirms a highlight', async () => {
    const { result: i18n } = renderHook(() => useTranslation());
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    const modules = [
      moduleAt('src/a.ts', [{ resolved: 'src/b.ts' } as IModule['dependencies'][0]]),
      moduleAt('src/b.ts'),
    ];

    renderDialog(modules, onConfirm, onClose);

    expect(screen.getByText(i18n.current.t('highlightEdge.selectSource'))).toBeInTheDocument();

    const sourceInput = screen.getByPlaceholderText(i18n.current.t('quickPick.filePlaceholder'));
    fireEvent.change(sourceInput, { target: { value: 'a.ts' } });
    fireEvent.click(await screen.findByText('a.ts'));

    expect(screen.getByText(i18n.current.t('highlightEdge.selectTarget'))).toBeInTheDocument();

    const targetInput = screen.getByPlaceholderText(i18n.current.t('quickPick.filePlaceholder'));
    fireEvent.change(targetInput, { target: { value: 'b.ts' } });
    fireEvent.click(await screen.findByText('b.ts'));

    expect(screen.getByText(i18n.current.t('highlightEdge.selectColor'))).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText(USER_EDGE_HIGHLIGHT_COLORS[0]));

    expect(onConfirm).toHaveBeenCalledWith(['src/a.ts->src/b.ts'], USER_EDGE_HIGHLIGHT_COLORS[0]);
    expect(onClose).toHaveBeenCalled();
  });

  it('allows selecting a folder target and highlights all deps under it', async () => {
    const { result: i18n } = renderHook(() => useTranslation());
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    const modules = [
      moduleAt('src/a.ts', [
        { resolved: 'src/foo/b.ts' } as IModule['dependencies'][0],
        { resolved: 'src/foo/c.ts' } as IModule['dependencies'][0],
      ]),
      moduleAt('src/foo/b.ts'),
      moduleAt('src/foo/c.ts'),
    ];

    renderDialog(modules, onConfirm, onClose);

    const sourceInput = screen.getByPlaceholderText(i18n.current.t('quickPick.filePlaceholder'));
    fireEvent.change(sourceInput, { target: { value: 'a.ts' } });
    fireEvent.click(await screen.findByText('a.ts'));

    const targetInput = screen.getByPlaceholderText(i18n.current.t('quickPick.filePlaceholder'));
    fireEvent.change(targetInput, { target: { value: 'src/foo' } });
    const folderOption = (await screen.findAllByRole('option')).find(option => option.textContent?.startsWith('foo'));
    expect(folderOption).toBeDefined();
    fireEvent.click(folderOption!);

    fireEvent.click(screen.getByLabelText(USER_EDGE_HIGHLIGHT_COLORS[0]));

    expect(onConfirm).toHaveBeenCalledWith(
      ['src/a.ts->src/foo/b.ts', 'src/a.ts->src/foo/c.ts'],
      USER_EDGE_HIGHLIGHT_COLORS[0],
    );
    expect(onClose).toHaveBeenCalled();
  });
});
