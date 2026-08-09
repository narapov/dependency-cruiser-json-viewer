import { useEffect } from 'react';

interface UseSidebarShortcutOptions {
  onToggle: () => void;
  onShowFileTree: () => void;
  onShowRulesPanel: () => void;
  onShowCircularPanel: () => void;
}

export function useSidebarShortcut({
  onToggle,
  onShowFileTree,
  onShowRulesPanel,
  onShowCircularPanel,
}: UseSidebarShortcutOptions) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey)) {
        return;
      }

      const key = event.key.toLowerCase();

      if (event.shiftKey && key === 'e') {
        event.preventDefault();
        onShowFileTree();
        return;
      }

      if (event.shiftKey && key === 'm') {
        event.preventDefault();
        onShowRulesPanel();
        return;
      }

      if (event.shiftKey && key === 'c') {
        event.preventDefault();
        onShowCircularPanel();
        return;
      }

      if (!event.shiftKey && key === 'b') {
        event.preventDefault();
        onToggle();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onToggle, onShowFileTree, onShowRulesPanel, onShowCircularPanel]);
}
