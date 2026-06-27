import { useMemo } from 'react'
import CloseOutlined from '@mui/icons-material/CloseOutlined'
import ContentCopyOutlined from '@mui/icons-material/ContentCopyOutlined'
import MyLocationOutlined from '@mui/icons-material/MyLocationOutlined'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction'
import ListItemText from '@mui/material/ListItemText'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import type { IModule } from 'dependency-cruiser'
import { CIRCULAR_EDGE_COLOR, copyToClipboard } from '../../Shared'
import { getNodeRelations } from '../../domain'

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
    return (
      <Typography color="text.secondary" align="center" sx={{ py: 2 }}>
        No dependencies
      </Typography>
    )
  }

  return (
    <List dense disablePadding>
      {items.map((item) => (
        <ListItem key={item.path} disableGutters>
          <ListItemText
            primary={item.path}
            slotProps={{
              primary: {
                sx: {
                  fontFamily: 'monospace',
                  fontSize: 11,
                  wordBreak: 'break-all',
                  color: item.circular ? CIRCULAR_EDGE_COLOR : undefined,
                },
              },
            }}
          />
          <ListItemSecondaryAction>
            <Tooltip title="Copy path">
              <IconButton
                edge="end"
                aria-label="Copy path"
                onClick={() => void copyToClipboard(item.path)}
              >
                <ContentCopyOutlined fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Show in graph">
              <IconButton
                edge="end"
                aria-label="Show in graph"
                onClick={() => onShowInGraph(item.path)}
              >
                <MyLocationOutlined fontSize="small" />
              </IconButton>
            </Tooltip>
          </ListItemSecondaryAction>
        </ListItem>
      ))}
    </List>
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
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <Stack
        direction="row"
        spacing={1}
        sx={{ px: 2, py: 1.5, flexShrink: 0, alignItems: 'flex-start' }}
      >
        <Typography
          component="div"
          sx={{
            flex: 1,
            minWidth: 0,
            fontFamily: 'monospace',
            wordBreak: 'break-all',
          }}
        >
          {path}
        </Typography>
        <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
          <Tooltip title="Show in graph">
            <IconButton color="primary" aria-label="Show in graph" onClick={() => onShowInGraph(path)}>
              <MyLocationOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Close">
            <IconButton aria-label="Close" onClick={onClose}>
              <CloseOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>
      <Divider />
      <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', px: 2, py: 1.5 }}>
        <Typography variant="subtitle1" gutterBottom>
          Dependencies
        </Typography>
        <RelationList items={relations.dependencies} onShowInGraph={onShowInGraph} />

        <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
          Dependents
        </Typography>
        <RelationList items={relations.dependents} onShowInGraph={onShowInGraph} />
      </Box>
    </Box>
  )
}
