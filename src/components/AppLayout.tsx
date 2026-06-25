import { Layout, Typography } from 'antd'
import type { TreeDataNode } from 'antd'
import { FileTree } from './FileTree'

const { Header, Sider, Content } = Layout

interface AppLayoutProps {
  treeData: TreeDataNode[]
  moduleCount?: number
}

export function AppLayout({ treeData, moduleCount }: AppLayoutProps) {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', padding: '0 24px' }}>
        <Typography.Title level={4} style={{ margin: 0, color: '#fff' }}>
          Deps Viewer
          {moduleCount != null && (
            <Typography.Text
              type="secondary"
              style={{ marginLeft: 12, fontSize: 14, fontWeight: 400 }}
            >
              {moduleCount} modules
            </Typography.Text>
          )}
        </Typography.Title>
      </Header>
      <Layout>
        <Sider
          width={280}
          theme="light"
          style={{ borderRight: '1px solid #f0f0f0', overflow: 'hidden' }}
        >
          <FileTree treeData={treeData} height={window.innerHeight - 64} />
        </Sider>
        <Content style={{ padding: 24 }}>
          <Typography.Text type="secondary">
            Select a file to view dependencies
          </Typography.Text>
        </Content>
      </Layout>
    </Layout>
  )
}
