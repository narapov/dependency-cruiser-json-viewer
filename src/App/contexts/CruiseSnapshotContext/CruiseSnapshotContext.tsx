import { createContext, useContext } from 'react';

import type { CruiseSnapshot } from '@/domain';

const CruiseSnapshotContext = createContext<CruiseSnapshot | null>(null);

export function CruiseSnapshotProvider(props: { value: CruiseSnapshot | null; children: React.ReactNode }) {
  const { value, children } = props;

  return <CruiseSnapshotContext.Provider value={value}>{children}</CruiseSnapshotContext.Provider>;
}

/** Cruise snapshot from the nearest provider; `null` when no cruise data is loaded. */
export function useCruiseSnapshot(): CruiseSnapshot | null {
  return useContext(CruiseSnapshotContext);
}

/** Cruise snapshot; throws when used outside a provider with data. */
export function useCruiseSnapshotRequired(): CruiseSnapshot {
  const snapshot = useCruiseSnapshot();
  if (snapshot == null) {
    throw new Error('useCruiseSnapshotRequired must be used within CruiseSnapshotProvider with a snapshot');
  }
  return snapshot;
}
