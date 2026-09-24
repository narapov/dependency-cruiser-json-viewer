import { createContext, useContext } from 'react';

import type { CruiseTreeSnapshot } from '@/domain';

const CruiseTreeContext = createContext<CruiseTreeSnapshot | null>(null);

export function CruiseTreeProvider(props: { value: CruiseTreeSnapshot | null; children: React.ReactNode }) {
  const { value, children } = props;

  return <CruiseTreeContext.Provider value={value}>{children}</CruiseTreeContext.Provider>;
}

/** Cruise tree snapshot from the nearest provider; `null` when no cruise data is loaded. */
export function useCruiseTree(): CruiseTreeSnapshot | null {
  return useContext(CruiseTreeContext);
}

/** Cruise tree snapshot; throws when used outside a provider with data. */
export function useCruiseTreeRequired(): CruiseTreeSnapshot {
  const snapshot = useCruiseTree();
  if (snapshot == null) {
    throw new Error('useCruiseTreeRequired must be used within CruiseTreeProvider with a snapshot');
  }
  return snapshot;
}
