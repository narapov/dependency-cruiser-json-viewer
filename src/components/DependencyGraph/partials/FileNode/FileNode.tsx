import Box from '@mui/material/Box';
import { Handle, Position, type NodeProps } from '@xyflow/react';

import { CIRCULAR_NODE_BACKGROUND, MaterialFileSystemIcon } from '@/Shared';

import type { FileNodeData } from '../../types';
import { NodeContextMenu } from '../NodeContextMenu';

export function FileNode({ data }: NodeProps) {
  const { label, path, highlighted, circular, onShowInFileTree, onShowDependencies } = data as FileNodeData;

  return (
    <NodeContextMenu
      path={path}
      isFolder={false}
      onShowInFileTree={onShowInFileTree}
      onShowDependencies={onShowDependencies}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          px: '10px',
          py: '6px',
          bgcolor: circular ? CIRCULAR_NODE_BACKGROUND : 'background.paper',
          border: 1,
          borderColor: circular ? 'var(--graph-circular)' : 'divider',
          borderRadius: 1,
          fontSize: 12,
          minWidth: 120,
          boxSizing: 'border-box',
          width: '100%',
          ...(highlighted && {
            borderColor: 'primary.main',
            boxShadow: theme => `0 0 0 1px ${theme.palette.primary.main}`,
          }),
        }}
      >
        <Handle type="target" position={Position.Left} />
        <Box component="span" sx={{ fontSize: 12, flexShrink: 0, display: 'inline-flex' }}>
          <MaterialFileSystemIcon name={label} />
        </Box>
        <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {label}
        </Box>
        <Handle type="source" position={Position.Right} />
      </Box>
    </NodeContextMenu>
  );
}
