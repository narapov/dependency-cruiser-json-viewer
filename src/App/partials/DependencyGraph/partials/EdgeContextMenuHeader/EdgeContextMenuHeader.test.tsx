// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';

import { screen } from '@testing-library/react';

import { renderWithTheme } from '@/testsUtils';

import { EdgeContextMenuHeader } from './EdgeContextMenuHeader';

describe('EdgeContextMenuHeader', () => {
  it('renders source and target paths', () => {
    renderWithTheme(<EdgeContextMenuHeader source="src/a.ts" target="src/b.ts" />);

    expect(screen.getByText('src/a.ts')).toBeInTheDocument();
    expect(screen.getByText('src/b.ts')).toBeInTheDocument();
    expect(screen.getByText('→')).toBeInTheDocument();
  });
});
