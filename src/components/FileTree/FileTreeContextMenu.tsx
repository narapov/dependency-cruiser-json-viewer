import type { ReactNode } from 'react'
import { Dropdown, type MenuProps } from 'antd'

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
  const items: MenuProps['items'] = []

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
    if (key === 'expand-recursive') {
      onExpandRecursive?.(path)
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
