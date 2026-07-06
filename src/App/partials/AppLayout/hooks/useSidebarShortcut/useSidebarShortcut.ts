import { useEffect } from 'react';

interface UseSidebarShortcutOptions {
  onToggle: () => void;
}

export function useSidebarShortcut({ onToggle }: UseSidebarShortcutOptions) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'b') {
        event.preventDefault();
        onToggle();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onToggle]);
}
