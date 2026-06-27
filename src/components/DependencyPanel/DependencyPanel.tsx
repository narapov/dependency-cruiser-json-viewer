import { useMemo } from 'react'
import { AimOutlined, CloseOutlined, CopyOutlined } from '@ant-design/icons'
import { Button, Empty, List, Tooltip, Typography } from 'antd'
import type { IModule } from 'dependency-cruiser'
import { copyToClipboard } from '../../Shared'
import { getNodeRelations } from '../../domain'
import styles from './DependencyPanel.module.css'

interface DependencyPanelProps {
  path: string
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

export function DependencyPanel({
  path,
  modules,
  selectedPaths,
  expandedKeys,
  onClose,
  onShowInGraph,
}: DependencyPanelProps) {
  const expandedFolders = useMemo(() => new Set(expandedKeys), [expandedKeys])

  const relations = useMemo(
    () => getNodeRelations(path, modules, selectedPaths, expandedFolders),
    [path, modules, selectedPaths, expandedFolders],
  )

  return (
    <div className={styles.panel}>
      <header className={styles.header}>
        <div className={styles.path}>{path}</div>
        <div className={styles.headerActions}>
          <Tooltip title="Show in graph">
            <Button
              type="primary"
              size="small"
              icon={<AimOutlined />}
              onClick={() => onShowInGraph(path)}
            />
          </Tooltip>
          <Tooltip title="Close">
            <Button type="text" size="small" icon={<CloseOutlined />} onClick={onClose} />
          </Tooltip>
        </div>
      </header>
      <div className={styles.body}>
        <Typography.Title level={5} className={styles.sectionTitle}>
          Dependencies
        </Typography.Title>
        <RelationList items={relations.dependencies} onShowInGraph={onShowInGraph} />

        <Typography.Title level={5} className={styles.sectionTitle} style={{ marginTop: 24 }}>
          Dependents
        </Typography.Title>
        <RelationList items={relations.dependents} onShowInGraph={onShowInGraph} />
      </div>
    </div>
  )
}
