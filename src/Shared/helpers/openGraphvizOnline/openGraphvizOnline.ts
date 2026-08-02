const GRAPHVIZ_ONLINE_BASE = 'https://dreampuf.github.io/GraphvizOnline/';

/** Open Graphviz Online with DOT preloaded (nop2 engine). */
export function openGraphvizOnline(dot: string): void {
  const url = `${GRAPHVIZ_ONLINE_BASE}?engine=nop2#${encodeURIComponent(dot)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}
