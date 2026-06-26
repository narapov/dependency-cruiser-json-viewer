import type { ReactNode } from 'react'
import { Dropdown, type MenuProps } from 'antd'

interface NodeContextMenuProps {
  path: string
  isFolder: boolean
  expanded?: boolean
  onToggle?: (path: string) => void
  onShowInFileTree: (path: string) => void
  onShowDependencies?: (path: string) => void
  children: ReactNode
}

export function NodeContextMenu({
  path,
  isFolder,
  expanded,
  onToggle,
  onShowInFileTree,
  onShowDependencies,
  children,
}: NodeContextMenuProps) {
  const items: MenuProps['items'] = []

  if (isFolder && onToggle) {
    items.push({
      key: 'toggle',
      label: expanded ? 'Collapse' : 'Expand',
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
    if (key === 'toggle') {
      onToggle?.(path)
    } else if (key === 'show-in-tree') {
      onShowInFileTree(path)
    } else if (key === 'show-dependencies') {
      onShowDependencies?.(path)
    }
  }

  return (
    <Dropdown menu={{ items, onClick }} trigger={['contextMenu']}>
      {children}
    </Dropdown>
  )
}
