// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';

import { screen } from '@testing-library/react';

import { renderWithTheme } from '@/testsUtils';

import { HighlightedMatchText } from './HighlightedMatchText';

function Highlight({ children }: { children: React.ReactNode }) {
  return <mark data-testid="hl">{children}</mark>;
}

describe('HighlightedMatchText', () => {
  it('renders plain text when indexes are empty', () => {
    renderWithTheme(<HighlightedMatchText text="hello" indexes={[]} Highlight={Highlight} />);

    expect(screen.getByText('hello')).toBeInTheDocument();
    expect(screen.queryByTestId('hl')).not.toBeInTheDocument();
  });

  it('wraps merged highlight ranges', () => {
    const { container } = renderWithTheme(
      <HighlightedMatchText text="abcdef" indexes={[1, 2, 4]} Highlight={Highlight} />,
    );

    const marks = screen.getAllByTestId('hl');
    expect(marks[0]).toHaveTextContent('bc');
    expect(marks[1]).toHaveTextContent('e');
    expect(container).toHaveTextContent('abcdef');
  });
});
