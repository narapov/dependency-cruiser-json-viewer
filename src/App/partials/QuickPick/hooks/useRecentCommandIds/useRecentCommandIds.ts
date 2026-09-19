import { useState } from 'react';

import { pushRecentCommandId, readRecentCommandIds, writeRecentCommandIds } from '../../helpers/recentCommandIds';

export function useRecentCommandIds() {
  const [recentIds, setRecentIds] = useState(readRecentCommandIds);

  const recordCommandUsage = (id: string) => {
    const next = pushRecentCommandId(recentIds, id);
    writeRecentCommandIds(next);
    setRecentIds(next);
  };

  return {
    recentIds,
    recordCommandUsage,
  };
}
