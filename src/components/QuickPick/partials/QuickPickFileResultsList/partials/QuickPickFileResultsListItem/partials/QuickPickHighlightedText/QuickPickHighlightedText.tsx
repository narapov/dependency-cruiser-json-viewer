import type { ComponentType, ReactNode } from 'react';

import Box from '@mui/material/Box';
import type { SxProps, Theme } from '@mui/material/styles';

export type QuickPickHighlightComponent = ComponentType<{ children: ReactNode }>;

interface QuickPickHighlightedTextProps {
  text: string;
  indexes: number[];
  Highlight: QuickPickHighlightComponent;
  sx?: SxProps<Theme>;
}

export function QuickPickHighlightedText({ text, indexes, Highlight, sx }: QuickPickHighlightedTextProps) {
  if (indexes.length === 0) {
    return (
      <Box component="span" sx={sx}>
        {text}
      </Box>
    );
  }

  const sorted = [...indexes].sort((a, b) => a - b);
  const segments: ReactNode[] = [];
  let position = 0;

  for (let index = 0; index < sorted.length; index++) {
    const start = sorted[index];
    let end = start + 1;
    while (index + 1 < sorted.length && sorted[index + 1] === end) {
      end++;
      index++;
    }

    if (position < start) {
      segments.push(text.slice(position, start));
    }
    segments.push(<Highlight key={start}>{text.slice(start, end)}</Highlight>);
    position = end;
  }

  if (position < text.length) {
    segments.push(text.slice(position));
  }

  return (
    <Box component="span" sx={sx}>
      {segments}
    </Box>
  );
}
