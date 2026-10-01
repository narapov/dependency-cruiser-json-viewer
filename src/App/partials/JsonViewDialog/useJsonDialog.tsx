import { useState, type ReactNode } from 'react';

import { type DialogProps } from '@mui/material/Dialog';

import { JsonViewDialog } from './JsonViewDialog';

type ShouldExpandNode = (level: number, value: unknown, field?: string) => boolean;

export interface JsonDialogView {
  title: string;
  data: object;
  shouldExpandNode?: ShouldExpandNode;
  maxWidth?: DialogProps['maxWidth'];
  fullScreen?: boolean;
}

/**
 * Owns JsonViewDialog open-state. Call with defaults and/or pass a view to `openJsonDialog`.
 */
export function useJsonDialog(defaults: Partial<JsonDialogView> = {}): {
  openJsonDialog: (next?: Partial<JsonDialogView>) => void;
  jsonDialog: ReactNode;
} {
  const [view, setView] = useState<JsonDialogView | null>(null);

  const openJsonDialog = (next: Partial<JsonDialogView> = {}) => {
    const title = next.title ?? defaults.title;
    const data = next.data ?? defaults.data;
    if (!title || !data) {
      return;
    }
    setView({
      title,
      data,
      shouldExpandNode: next.shouldExpandNode ?? defaults.shouldExpandNode,
      maxWidth: next.maxWidth ?? defaults.maxWidth,
      fullScreen: next.fullScreen ?? defaults.fullScreen,
    });
  };

  const jsonDialog = (
    <JsonViewDialog
      open={!!view}
      title={view?.title ?? ''}
      data={view?.data ?? null}
      onClose={() => setView(null)}
      shouldExpandNode={view?.shouldExpandNode}
      maxWidth={view?.maxWidth}
      fullScreen={view?.fullScreen}
    />
  );

  return { openJsonDialog, jsonDialog };
}
