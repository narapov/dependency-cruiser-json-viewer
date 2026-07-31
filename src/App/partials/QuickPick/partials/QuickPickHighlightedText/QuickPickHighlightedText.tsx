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

interface HighlightRange {
  start: number;
  end: number;
}

function mergeHighlightRanges(sortedIndexes: number[]): HighlightRange[] {
  return sortedIndexes.reduce<HighlightRange[]>((ranges, index) => {
    const last = ranges.at(-1);
    if (last && last.end === index) {
      return [...ranges.slice(0, -1), { start: last.start, end: index + 1 }];
    }
    return [...ranges, { start: index, end: index + 1 }];
  }, []);
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
