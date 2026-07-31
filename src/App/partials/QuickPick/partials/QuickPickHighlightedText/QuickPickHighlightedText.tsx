import type { ComponentType, ReactNode } from 'react';

import Box from '@mui/material/Box';
import type { SxProps, Theme } from '@mui/material/styles';

import { mergeHighlightRanges } from '../../helpers/mergeHighlightRanges';

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

  const ranges = mergeHighlightRanges([...indexes].sort((a, b) => a - b));
  const { segments, position } = ranges.reduce<{ segments: ReactNode[]; position: number }>(
    (acc, range) => {
      const nextSegments = [...acc.segments];
      if (acc.position < range.start) {
        nextSegments.push(text.slice(acc.position, range.start));
      }
      nextSegments.push(<Highlight key={range.start}>{text.slice(range.start, range.end)}</Highlight>);
      return { segments: nextSegments, position: range.end };
    },
    { segments: [], position: 0 },
  );

  return (
    <Box component="span" sx={sx}>
      {[...segments, ...(position < text.length ? [text.slice(position)] : [])]}
    </Box>
  );
}
