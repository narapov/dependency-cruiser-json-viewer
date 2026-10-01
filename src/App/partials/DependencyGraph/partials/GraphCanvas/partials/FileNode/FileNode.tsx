import { memo, type MouseEvent } from 'react';

import Box from '@mui/material/Box';
import { Handle, Position, type NodeProps } from '@xyflow/react';

import { CIRCULAR_NODE_BACKGROUND, ERROR_NODE_BACKGROUND, MaterialFileSystemIcon } from '@/Shared';

import { useWorkspaceStore } from '../../../../../../stores/workspaceStore';
import type { FileNodeData } from '../../types';
import { NodeContextMenuTrigger, useNodeContextMenuControls } from '../NodeContextMenu';

export const FileNode = memo(function FileNode(props: NodeProps) {
  const { data } = props;

  const { label, path, circular, couldNotResolve } = data as FileNodeData;
  const isActive = useWorkspaceStore(state => state.activePath === path);
  const { openContextMenu } = useNodeContextMenuControls();

  let bgcolor: string = 'background.paper';
  let borderColor: string = 'divider';
  if (couldNotResolve) {
    bgcolor = ERROR_NODE_BACKGROUND;
    borderColor = 'var(--graph-error)';
  } else if (circular) {
    bgcolor = CIRCULAR_NODE_BACKGROUND;
    borderColor = 'var(--graph-circular)';
  }

  const onContextMenu = (event: MouseEvent) => {
    openContextMenu(event, path);
  };

  return (
    <Box
      onContextMenu={onContextMenu}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.75,
        px: '10px',
        py: '6px',
        bgcolor,
        border: 1,
        borderColor,
        borderRadius: 1,
        fontSize: 12,
        minWidth: 120,
        boxSizing: 'border-box',
        width: '100%',
        ...(isActive && {
          borderColor: 'primary.main',
          boxShadow: theme => `0 0 0 1px ${theme.palette.primary.main}`,
        }),
      }}
    >
      <Handle type="target" position={Position.Left} />
      <Box component="span" sx={{ fontSize: 12, flexShrink: 0, display: 'inline-flex' }}>
        <MaterialFileSystemIcon name={label} />
      </Box>
      <Box
        component="span"
        sx={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
      >
        {label}
      </Box>
      <NodeContextMenuTrigger path={path} />
      <Handle type="source" position={Position.Right} />
    </Box>
  );
});
