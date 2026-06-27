import type { ReactNode } from 'react'
import { Dropdown, type MenuProps } from 'antd'
import { copyToClipboard } from '../../../../Shared'

interface FileTreeContextMenuProps {
  path: string
  isFolder?: boolean
  onExpandRecursive?: (path: string) => void
  onShowDependencies?: (path: string) => void
  children: ReactNode
}

export function FileTreeContextMenu({
  path,
  isFolder = false,
  onExpandRecursive,
  onShowDependencies,
  children,
}: FileTreeContextMenuProps) {
  const items: MenuProps['items'] = [
    {
      key: 'copy',
      label: 'Copy',
    },
  ]

  if (isFolder && onExpandRecursive) {
    items.push({
      key: 'expand-recursive',
      label: 'Expand recursive',
    })
  }

  if (onShowDependencies) {
    items.push({
      key: 'show-dependencies',
      label: 'View dependencies',
    })
  }

  const onClick: MenuProps['onClick'] = ({ key, domEvent }) => {
    domEvent.stopPropagation()
    switch (key) {
      case 'copy': {
        void copyToClipboard(path)
        return
      }
      case 'expand-recursive': {
        onExpandRecursive?.(path)
        return
      }
      case 'show-dependencies': {
        onShowDependencies?.(path)
        return
      }
      default: {
        return
      }
    }
  }

  return (
    <Dropdown menu={{ items, onClick }} trigger={['contextMenu']}>
      {children}
    </Dropdown>
  )
}
