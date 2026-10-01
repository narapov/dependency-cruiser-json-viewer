import { memo, type MouseEvent } from 'react';

import Box from '@mui/material/Box';
import { Handle, Position, type NodeProps } from '@xyflow/react';

import { CIRCULAR_NODE_BACKGROUND, MaterialFileSystemIcon } from '@/Shared';

import { useWorkspaceStore } from '../../../../../../stores/workspaceStore';
import { useGraphWorkspaceActions } from '../../hooks';
import type { FolderNodeData } from '../../types';
import { FolderExpandToggle } from '../FolderExpandToggle';
import { NodeContextMenuTrigger, useNodeContextMenuControls } from '../NodeContextMenu';

export const FolderNode = memo(function FolderNode(props: NodeProps) {
  const { data } = props;

  const { label, path, expanded, circular, backgroundColor } = data as FolderNodeData;
  const isActive = useWorkspaceStore(state => state.activePath === path);
  const { toggleFolder } = useGraphWorkspaceActions();
  const { openContextMenu } = useNodeContextMenuControls();

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
        bgcolor: circular ? CIRCULAR_NODE_BACKGROUND : backgroundColor,
        border: 1,
        borderColor: circular ? 'var(--graph-circular)' : 'divider',
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
      <FolderExpandToggle
        expanded={expanded}
        onClick={e => {
          e.stopPropagation();
          toggleFolder(path);
        }}
      />
      <Box component="span" sx={{ fontSize: 12, flexShrink: 0, display: 'inline-flex' }}>
        <MaterialFileSystemIcon name={label} isFolder isOpen={expanded} />
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
