import { getMaterialFileIcon, getMaterialFolderIcon } from '@baybreezy/file-extension-icon';

interface MaterialFileSystemIconProps {
  name: string;
  isFolder?: boolean;
  isOpen?: boolean;
  className?: string;
}

export function MaterialFileSystemIcon({ name, isFolder, isOpen, className }: MaterialFileSystemIconProps) {
  const src = isFolder ? getMaterialFolderIcon(name, isOpen ?? false) : getMaterialFileIcon(name);

  return (
    <img src={src} alt="" aria-hidden className={className} style={{ width: '1em', height: '1em', flexShrink: 0 }} />
  );
}
