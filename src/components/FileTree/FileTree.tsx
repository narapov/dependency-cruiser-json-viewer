import { FileOutlined, FolderOutlined } from '@ant-design/icons'
import { Tree, type TreeDataNode } from 'antd'
import styles from './FileTree.module.css'

interface FileTreeProps {
  treeData: TreeDataNode[]
  height: number
}

export function FileTree({ treeData, height }: FileTreeProps) {
  return (
    <div className={styles.scroll} style={{ height }}>
      <Tree
        className={styles.tree}
        treeData={treeData}
        defaultExpandAll={false}
        virtual={false}
        height={height}
        titleRender={(node) => (
          <span className={styles.title}>
            {node.isLeaf ? <FileOutlined /> : <FolderOutlined />}
            {node.title as string}
          </span>
        )}
      />
    </div>
  )
}
