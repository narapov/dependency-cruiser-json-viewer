import { useMemo } from 'react'
import { AimOutlined, CopyOutlined } from '@ant-design/icons'
import { Button, Drawer, Empty, List, Tooltip, Typography } from 'antd'
import type { IModule } from 'dependency-cruiser'
import { copyToClipboard } from '../../lib/copyToClipboard'
import { getNodeRelations } from '../../lib/dependencyGraph/moduleRelations'
import styles from './DependencyDrawer.module.css'

interface DependencyDrawerProps {
  open: boolean
  path: string | null
  modules: IModule[]
  selectedPaths: string[]
  expandedKeys: string[]
  onClose: () => void
  onShowInGraph: (path: string) => void
}

function RelationList({
  items,
  onShowInGraph,
}: {
  items: { path: string; circular: boolean }[]
  onShowInGraph: (path: string) => void
}) {
  if (items.length === 0) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No dependencies" />
  }

  return (
    <List
      className={styles.list}
      size="small"
      dataSource={items}
      renderItem={(item) => (
        <List.Item
          actions={[
            <Tooltip key="copy" title="Copy path">
              <Button
                type="text"
                size="small"
                icon={<CopyOutlined />}
                onClick={() => void copyToClipboard(item.path)}
              />
            </Tooltip>,
            <Tooltip key="show" title="Show in graph">
              <Button
                type="text"
                size="small"
                icon={<AimOutlined />}
                onClick={() => onShowInGraph(item.path)}
              />
            </Tooltip>,
          ]}
        >
          <span className={`${styles.path} ${item.circular ? styles.circular : ''}`}>
            {item.path}
          </span>
        </List.Item>
      )}
    />
  )
}

export function DependencyDrawer({
  open,
  path,
  modules,
  selectedPaths,
  expandedKeys,
  onClose,
  onShowInGraph,
}: DependencyDrawerProps) {
  const expandedFolders = useMemo(() => new Set(expandedKeys), [expandedKeys])

  const relations = useMemo(
    () =>
      path
        ? getNodeRelations(path, modules, selectedPaths, expandedFolders)
        : { dependencies: [], dependents: [] },
    [path, modules, selectedPaths, expandedFolders],
  )

  return (
    <Drawer
      title={
        path ? (
          <div className={styles.path}>{path}</div>
        ) : (
          'Dependencies'
        )
      }
      extra={
        path ? (
          <Tooltip title="Show in graph">
            <Button
              type="primary"
              size="small"
              icon={<AimOutlined />}
              onClick={() => onShowInGraph(path)}
            />
          </Tooltip>
        ) : null
      }
      placement="right"
      width={440}
      open={open}
      onClose={onClose}
      destroyOnHidden
    >
      <Typography.Title level={5} className={styles.sectionTitle}>
        Dependencies
      </Typography.Title>
      <RelationList items={relations.dependencies} onShowInGraph={onShowInGraph} />

      <Typography.Title level={5} className={styles.sectionTitle} style={{ marginTop: 24 }}>
        Dependents
      </Typography.Title>
      <RelationList items={relations.dependents} onShowInGraph={onShowInGraph} />
    </Drawer>
  )
}
