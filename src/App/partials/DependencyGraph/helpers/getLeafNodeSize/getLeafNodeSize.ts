export const LEAF_NODE_HEIGHT = 40;
export const LEAF_NODE_MIN_WIDTH = 120;
const HORIZONTAL_PADDING = 20;
const BORDER = 2;
const GAP = 6;
const ICON_SIZE = 12;
const FOLDER_TOGGLE_SIZE = 16;

const ASCII_CHAR_WIDTH = 7.1;
const WIDE_CHAR_WIDTH = 8.5;

export type LeafNodeKind = 'file' | 'folder';

function measureLabelWidth(label: string): number {
  let width = 0;

  for (const char of label) {
    const code = char.codePointAt(0) ?? 0;
    // 0x7f (127) is the last ASCII code point — Latin vs wider scripts (e.g. Cyrillic).
    width += code <= 0x7f ? ASCII_CHAR_WIDTH : WIDE_CHAR_WIDTH;
  }

  return width;
}

function getLeafChromeWidth(kind: LeafNodeKind): number {
  const iconAndGap = ICON_SIZE + GAP;

  if (kind === 'folder') {
    return HORIZONTAL_PADDING + BORDER + FOLDER_TOGGLE_SIZE + GAP + iconAndGap;
  }

  return HORIZONTAL_PADDING + BORDER + iconAndGap;
}

export function getLeafNodeSize(label: string, kind: LeafNodeKind): { width: number; height: number } {
  const width = Math.max(LEAF_NODE_MIN_WIDTH, Math.ceil(getLeafChromeWidth(kind) + measureLabelWidth(label)));

  return { width, height: LEAF_NODE_HEIGHT };
}
