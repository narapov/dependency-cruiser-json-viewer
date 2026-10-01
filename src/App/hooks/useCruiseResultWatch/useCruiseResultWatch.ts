import { useEffect, useEffectEvent } from 'react';
import { io } from 'socket.io-client';

import { useQueryClient } from '@tanstack/react-query';

import { CRUISE_RESULT_CHANGED_EVENT, CRUISE_RESULT_SOCKET_PATH, getWindowEnvs } from '@/Shared';

import { fetchCruiseResult } from '../../api/cruiseResult';
import { useWorkspaceStore } from '../../stores/workspaceStore';

/** Subscribe to cruise-result watch notifications and soft-reset the workspace. */
export function useCruiseResultWatch(): void {
  const queryClient = useQueryClient();
  const watchEnabled = getWindowEnvs()?.watch === true;

  const onCruiseResultChanged = useEffectEvent(async () => {
    const cruiseResult = await fetchCruiseResult(undefined, { cacheBust: true });
    const next = useWorkspaceStore.getState().reset(cruiseResult, 'soft');
    queryClient.setQueryData(['cruise-result'], next.cruiseResult);
  });

  useEffect(() => {
    if (!watchEnabled) {
      return;
    }

    const socket = io({ path: CRUISE_RESULT_SOCKET_PATH });
    const onChanged = () => {
      void onCruiseResultChanged();
    };
    socket.on(CRUISE_RESULT_CHANGED_EVENT, onChanged);

    return () => {
      socket.off(CRUISE_RESULT_CHANGED_EVENT, onChanged);
      socket.disconnect();
    };
  }, [watchEnabled]);
}
