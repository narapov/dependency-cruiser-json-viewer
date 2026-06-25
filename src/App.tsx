import { useMemo } from 'react'
import { Alert, Flex, Spin } from 'antd'
import { AppLayout } from './components/AppLayout'
import { useCruiseResult } from './hooks/useCruiseResult'
import { buildFileTree } from './lib/buildFileTree'

function App() {
  const { data, isPending, isError, error } = useCruiseResult()

  const treeData = useMemo(
    () => (data ? buildFileTree(data.modules.map((m) => m.source)) : []),
    [data],
  )

  if (isPending) {
    return (
      <Flex align="center" justify="center" style={{ minHeight: '100vh' }}>
        <Spin size="large" />
      </Flex>
    )
  }

  if (isError) {
    return (
      <Flex align="center" justify="center" style={{ minHeight: '100vh' }}>
        <Alert
          type="error"
          message="Failed to load cruise result"
          description={error.message}
          showIcon
        />
      </Flex>
    )
  }

  return (
    <AppLayout
      treeData={treeData}
      moduleCount={data.summary.totalCruised}
    />
  )
}

export default App
