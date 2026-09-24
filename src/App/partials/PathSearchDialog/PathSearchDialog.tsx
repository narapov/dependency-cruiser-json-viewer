import { AppDialog, AppDialogContent, AppDialogTitle } from '@/Shared';

import { PathSearchBody } from './partials';

interface PathSearchDialogProps {
  open: boolean;
  title: string;
  /** When set, only these paths are searchable (e.g. module files without ancestor folders). */
  allowedPaths?: readonly string[];
  onSelect: (path: string) => void;
  onClose: () => void;
}

/** Titled dialog for fuzzy file/folder path selection. */
export function PathSearchDialog(props: PathSearchDialogProps) {
  const { open, title, allowedPaths, onSelect, onClose } = props;

  const handleSelect = (path: string) => {
    onSelect(path);
    onClose();
  };

  return (
    <AppDialog open={open} onClose={onClose} maxWidth="sm">
      {open && (
        <>
          <AppDialogTitle>{title}</AppDialogTitle>
          <AppDialogContent sx={{ p: 0 }}>
            <PathSearchBody allowedPaths={allowedPaths} onSelect={handleSelect} />
          </AppDialogContent>
        </>
      )}
    </AppDialog>
  );
}
