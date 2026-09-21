import { createContext, useContext } from 'react';

import type { GraphEdgeStyle } from '@/domain';

const EdgeStyleContext = createContext<GraphEdgeStyle>('bezier');

export function EdgeStyleProvider(props: { value: GraphEdgeStyle; children: React.ReactNode }) {
  const { value, children } = props;

  return <EdgeStyleContext.Provider value={value}>{children}</EdgeStyleContext.Provider>;
}

/** Current dependency edge path style from the nearest EdgeStyleProvider. */
export function useEdgeStyle(): GraphEdgeStyle {
  return useContext(EdgeStyleContext);
}
