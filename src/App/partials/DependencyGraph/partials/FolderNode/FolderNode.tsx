import Box from '@mui/material/Box';
import type { NodeProps } from '@xyflow/react';

import { CIRCULAR_NODE_BACKGROUND, MaterialFileSystemIcon } from '@/Shared';

import { useGraphActions } from '../../contexts';
import type { FolderNodeData } from '../../types';
import { FolderExpandToggle } from '../FolderExpandToggle';
import { NodeConnectionHandles } from '../NodeConnectionHandles';
import { NodeContextMenu, NodeContextMenuTrigger } from '../NodeContextMenu';

export function FolderNode(props: NodeProps) {
  const { data } = props;

  const { label, path, expanded, highlighted, circular, backgroundColor, incomingHandleCount, outgoingHandleCount } =
    data as FolderNodeData;
  const { onToggleFolder } = useGraphActions();

  return (
    <NodeContextMenu path={path} isFolder expanded={expanded}>
      <Box
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
          ...(highlighted && {
            borderColor: 'primary.main',
            boxShadow: theme => `0 0 0 1px ${theme.palette.primary.main}`,
          }),
        }}
      >
        <NodeConnectionHandles incomingHandleCount={incomingHandleCount} outgoingHandleCount={outgoingHandleCount} />
        <FolderExpandToggle
          expanded={expanded}
          onClick={e => {
            e.stopPropagation();
            onToggleFolder(path);
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
        <NodeContextMenuTrigger />
      </Box>
    </NodeContextMenu>
  );
}
