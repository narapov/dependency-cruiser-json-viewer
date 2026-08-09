import type { ComponentType, ReactNode } from 'react';

import Box from '@mui/material/Box';
import type { SxProps, Theme } from '@mui/material/styles';

import { mergeHighlightRanges } from '../../helpers/mergeHighlightRanges';

export type MatchHighlightComponent = ComponentType<{ children: ReactNode }>;

interface HighlightedMatchTextProps {
  text: string;
  indexes: number[];
  Highlight: MatchHighlightComponent;
  sx?: SxProps<Theme>;
}

/** Renders text with index-based highlight spans. */
export function HighlightedMatchText({ text, indexes, Highlight, sx }: HighlightedMatchTextProps) {
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
