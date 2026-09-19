import { useState } from 'react';

import { pushRecentCommandId, readRecentCommandIds, writeRecentCommandIds } from '../../helpers/recentCommandIds';

export function useRecentCommandIds() {
  const [recentIds, setRecentIds] = useState(readRecentCommandIds);

  const recordCommandUsage = (id: string) => {
    setRecentIds(current => {
      const next = pushRecentCommandId(current, id);
      writeRecentCommandIds(next);
      return next;
    });
  };

  return {
    recentIds,
    recordCommandUsage,
  };
}
