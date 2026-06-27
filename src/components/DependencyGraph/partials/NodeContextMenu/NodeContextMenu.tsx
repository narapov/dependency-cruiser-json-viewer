import type { ReactNode } from 'react'
import { Dropdown, type MenuProps } from 'antd'
import { copyToClipboard } from '../../../../Shared'

interface NodeContextMenuProps {
  path: string
  isFolder: boolean
  expanded?: boolean
  onToggle?: (path: string) => void
  onExpandRecursive?: (path: string) => void
  onShowInFileTree: (path: string) => void
  onShowDependencies?: (path: string) => void
  children: ReactNode
}

export function NodeContextMenu({
  path,
  isFolder,
  expanded,
  onToggle,
  onExpandRecursive,
  onShowInFileTree,
  onShowDependencies,
  children,
}: NodeContextMenuProps) {
  const items: MenuProps['items'] = [
    {
      key: 'copy',
      label: 'Copy',
    },
  ]

  if (isFolder && onToggle) {
    items.push({
      key: 'toggle',
      label: expanded ? 'Collapse' : 'Expand',
    })
  }

  if (isFolder && onExpandRecursive) {
    items.push({
      key: 'expand-recursive',
      label: 'Expand recursive',
    })
  }

  items.push({
    key: 'show-in-tree',
    label: 'Show in file tree',
  })

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
      case 'toggle': {
        onToggle?.(path)
        return
      }
      case 'expand-recursive': {
        onExpandRecursive?.(path)
        return
      }
      case 'show-in-tree': {
        onShowInFileTree(path)
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
