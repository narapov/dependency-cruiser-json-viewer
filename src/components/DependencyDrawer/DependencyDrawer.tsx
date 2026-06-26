import { useMemo } from 'react'
import { AimOutlined } from '@ant-design/icons'
import { Button, Drawer, Empty, List, Typography } from 'antd'
import type { IModule } from 'dependency-cruiser'
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
      size="small"
      dataSource={items}
      renderItem={(item) => (
        <List.Item
          actions={[
            <Button
              key="show"
              type="link"
              size="small"
              icon={<AimOutlined />}
              onClick={() => onShowInGraph(item.path)}
            >
              Show in graph
            </Button>,
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
          <Button
            type="primary"
            size="small"
            icon={<AimOutlined />}
            onClick={() => onShowInGraph(path)}
          >
            Show in graph
          </Button>
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
