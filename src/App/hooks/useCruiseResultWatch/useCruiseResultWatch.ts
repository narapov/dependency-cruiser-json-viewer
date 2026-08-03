import type { ICruiseResult } from 'dependency-cruiser';
import { useEffect, useEffectEvent } from 'react';
import { io } from 'socket.io-client';

import { useQueryClient } from '@tanstack/react-query';

import type { ViewerWorkspaceSettings } from '@/domain';
import { CRUISE_RESULT_CHANGED_EVENT, CRUISE_RESULT_SOCKET_PATH, getWindowEnvs } from '@/Shared';

import { fetchCruiseResult } from '../../api/cruiseResult';
import { resolveWorkspaceApply, type ResolvedWorkspaceApply } from '../../helpers';

interface UseCruiseResultWatchOptions {
  cruiseLoadId: number;
  setCruiseLoadId: (next: number) => void;
  setPatterns: (patterns: string[]) => void;
  getCurrentWorkspaceSettings: () => ViewerWorkspaceSettings | null;
  applyWorkspaceView: (
    input: ResolvedWorkspaceApply & {
      cruiseLoadId: number;
    },
  ) => void;
}

/** Subscribe to cruise-result watch notifications and re-apply current workspace settings. */
export function useCruiseResultWatch({
  cruiseLoadId,
  setCruiseLoadId,
  setPatterns,
  getCurrentWorkspaceSettings,
  applyWorkspaceView,
}: UseCruiseResultWatchOptions): void {
  const queryClient = useQueryClient();
  const watchEnabled = getWindowEnvs()?.watch === true;

  const onCruiseResultChanged = useEffectEvent(async () => {
    const settings = getCurrentWorkspaceSettings();
    const nextCruiseLoadId = cruiseLoadId + 1;
    const cruiseResult = await queryClient.fetchQuery<ICruiseResult>({
      queryKey: ['cruise-result'],
      staleTime: 0,
      queryFn: ({ signal }) => fetchCruiseResult(signal, { cacheBust: true }),
    });
    setCruiseLoadId(nextCruiseLoadId);
    if (settings == null) {
      return;
    }
    setPatterns(settings.ignorePatterns);
    const resolved = resolveWorkspaceApply({ cruiseResult, settings });
    applyWorkspaceView({
      ...resolved,
      cruiseLoadId: nextCruiseLoadId,
    });
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
