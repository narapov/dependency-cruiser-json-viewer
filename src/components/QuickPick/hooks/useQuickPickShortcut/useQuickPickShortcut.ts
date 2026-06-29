import { useEffect } from 'react';

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    target.isContentEditable ||
    target.closest('[contenteditable="true"]') != null
  );
}

interface UseQuickPickShortcutOptions {
  open: boolean;
  onToggleFileMode: () => void;
  onOpenCommandMode: () => void;
}

export function useQuickPickShortcut({ open, onToggleFileMode, onOpenCommandMode }: UseQuickPickShortcutOptions) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'F1') {
        event.preventDefault();
        onOpenCommandMode();
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key === 'p') {
        if (!open && isEditableTarget(event.target)) return;
        event.preventDefault();
        onToggleFileMode();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onToggleFileMode, onOpenCommandMode]);
}
