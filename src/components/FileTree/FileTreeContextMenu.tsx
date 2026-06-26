import type { ReactNode } from 'react'
import { Dropdown, type MenuProps } from 'antd'

interface FileTreeContextMenuProps {
  path: string
  onShowDependencies: (path: string) => void
  children: ReactNode
}

export function FileTreeContextMenu({
  path,
  onShowDependencies,
  children,
}: FileTreeContextMenuProps) {
  const items: MenuProps['items'] = [
    {
      key: 'show-dependencies',
      label: 'View dependencies',
    },
  ]

  const onClick: MenuProps['onClick'] = ({ key, domEvent }) => {
    domEvent.stopPropagation()
    if (key === 'show-dependencies') {
      onShowDependencies(path)
    }
  }

  return (
    <Dropdown menu={{ items, onClick }} trigger={['contextMenu']}>
      {children}
    </Dropdown>
  )
}
