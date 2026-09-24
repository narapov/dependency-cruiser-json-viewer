import { createContext, useContext } from 'react';

import type { GraphEdgesType } from '@/domain';

const EdgesTypeContext = createContext<GraphEdgesType>('bezier');

export function EdgesTypeProvider(props: { value: GraphEdgesType; children: React.ReactNode }) {
  const { value, children } = props;

  return <EdgesTypeContext.Provider value={value}>{children}</EdgesTypeContext.Provider>;
}

/** Current dependency edge path type from the nearest EdgesTypeProvider. */
export function useEdgesType(): GraphEdgesType {
  return useContext(EdgesTypeContext);
}
