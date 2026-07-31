// @vitest-environment jsdom
import { type ReactElement } from 'react';
import { describe, expect, it } from 'vitest';

import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';

import { muiTheme } from '@/Shared/styles/muiTheme';

import { QuickPickHighlightedText } from './QuickPickHighlightedText';

function Highlight({ children }: { children: React.ReactNode }) {
  return <mark data-testid="hl">{children}</mark>;
}

function renderWithTheme(ui: ReactElement) {
  return render(
    <ThemeProvider theme={muiTheme} defaultMode="light">
      {ui}
    </ThemeProvider>,
  );
}

describe('QuickPickHighlightedText', () => {
  it('renders plain text when indexes are empty', () => {
    renderWithTheme(<QuickPickHighlightedText text="hello" indexes={[]} Highlight={Highlight} />);

    expect(screen.getByText('hello')).toBeInTheDocument();
    expect(screen.queryByTestId('hl')).not.toBeInTheDocument();
  });

  it('wraps merged highlight ranges', () => {
    const { container } = renderWithTheme(
      <QuickPickHighlightedText text="abcdef" indexes={[1, 2, 4]} Highlight={Highlight} />,
    );

    const marks = screen.getAllByTestId('hl');
    expect(marks[0]).toHaveTextContent('bc');
    expect(marks[1]).toHaveTextContent('e');
    expect(container).toHaveTextContent('abcdef');
  });
});
