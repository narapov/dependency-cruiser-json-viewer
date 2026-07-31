/** CSS variable for incoming dependency edge stroke. */
export const INCOMING_EDGE_COLOR = 'var(--graph-incoming)';

/** CSS variable for outgoing dependency edge stroke. */
export const OUTGOING_EDGE_COLOR = 'var(--graph-outgoing)';

/** CSS variable for circular dependency edge stroke. */
export const CIRCULAR_EDGE_COLOR = 'var(--graph-circular)';

/** CSS variable for type-only circular edge stroke. */
export const TYPE_ONLY_CIRCULAR_EDGE_COLOR = 'var(--graph-circular-type-only)';

/** CSS variable for circular node background fill. */
export const CIRCULAR_NODE_BACKGROUND = 'var(--graph-circular-background)';

/** CSS variable for selected edge stroke. */
export const SELECTED_EDGE_COLOR = 'var(--graph-selected)';

/** CSS variable for default edge stroke. */
export const DEFAULT_EDGE_COLOR = 'var(--graph-default-edge)';

/** Palette used when the user highlights edges manually. */
export const USER_EDGE_HIGHLIGHT_COLORS = [
  '#e6194b',
  '#3cb44b',
  '#ffe119',
  '#4363d8',
  '#f58231',
  '#911eb4',
  '#46f0f0',
  '#f032e6',
  '#bcf60c',
  '#fabebe',
  '#008080',
  '#e6beff',
  '#9a6324',
  '#fffac8',
  '#800000',
  '#aaffc3',
] as const;
