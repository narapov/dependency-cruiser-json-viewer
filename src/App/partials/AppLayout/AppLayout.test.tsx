// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { screen } from '@testing-library/react';

import { renderWithTheme } from '@/testsUtils';

import { initialWorkspaceState, useWorkspaceStore } from '../../stores/workspaceStore';
import { AppLayout } from './AppLayout';

describe('AppLayout', () => {
  beforeEach(() => {
    useWorkspaceStore.setState({ ...initialWorkspaceState });
  });

  it('shows dependencies and applicable-rules panels when store paths are set', () => {
    useWorkspaceStore.setState({
      ...initialWorkspaceState,
      dependenciesPanelPath: 'src/a.ts',
      applicableRulesPanelPath: 'src/a.ts',
    });

    renderWithTheme(
      <AppLayout
        header={<div>header</div>}
        sidebar={<div>sidebar</div>}
        main={<div>main</div>}
        dependenciesPanel={<div data-testid="dependencies-panel">deps</div>}
        applicableRulesPanel={<div data-testid="applicable-rules-panel">rules</div>}
        overlay={null}
        footer={<div>footer</div>}
        sidebarOpen
        sidebarView="files"
        onSelectSidebarView={vi.fn()}
      />,
    );

    expect(screen.getByTestId('dependencies-panel')).toBeInTheDocument();
    expect(screen.getByTestId('applicable-rules-panel')).toBeInTheDocument();
  });

  it('hides side panels when store paths are null', () => {
    renderWithTheme(
      <AppLayout
        header={<div>header</div>}
        sidebar={<div>sidebar</div>}
        main={<div>main</div>}
        dependenciesPanel={<div data-testid="dependencies-panel">deps</div>}
        applicableRulesPanel={<div data-testid="applicable-rules-panel">rules</div>}
        overlay={null}
        footer={<div>footer</div>}
        sidebarOpen={false}
        sidebarView="files"
        onSelectSidebarView={vi.fn()}
      />,
    );

    expect(screen.queryByTestId('dependencies-panel')).not.toBeInTheDocument();
    expect(screen.queryByTestId('applicable-rules-panel')).not.toBeInTheDocument();
  });
});
