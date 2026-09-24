import MenuList from '@mui/material/MenuList';

import { highlightColorMenuListSx, HighlightColorSwatches } from '@/Shared';

interface HighlightEdgeColorStepProps {
  currentHighlight: string | undefined;
  onSelect: (color: string | null) => void;
}

/** Color swatch step for the Highlight Edge dialog. */
export function HighlightEdgeColorStep(props: HighlightEdgeColorStepProps) {
  const { currentHighlight, onSelect } = props;

  return (
    <MenuList sx={highlightColorMenuListSx} autoFocusItem>
      <HighlightColorSwatches currentHighlight={currentHighlight} onSelect={onSelect} />
    </MenuList>
  );
}
