import clsx from 'clsx';

import Box from '@mui/material/Box';
import { Handle, Position, type NodeProps } from '@xyflow/react';

import { MaterialFileSystemIcon } from '@/Shared';

import { useGraphActions } from '../../contexts';
import type { FolderGroupNodeData } from '../../types';
import { FolderExpandToggle } from '../FolderExpandToggle';
import { NodeContextMenu } from '../NodeContextMenu';

import styles from './FolderGroupNode.module.css';

export function FolderGroupNode({ data }: NodeProps) {
  const { label, path, expanded, highlighted, backgroundColor } = data as FolderGroupNodeData;

  const { onToggleFolder, onAutoLayoutGroup, onAutoLayoutGroupRecursive } = useGraphActions();

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        border: 2,
        borderColor: 'divider',
        borderRadius: 2,
        position: 'relative',
        pointerEvents: 'none',
        bgcolor: backgroundColor,
        ...(highlighted && {
          borderColor: 'primary.main',
          boxShadow: theme => `0 0 0 1px ${theme.palette.primary.main}`,
        }),
      }}
    >
      <Handle type="target" position={Position.Left} className={styles.groupHandle} />
      <NodeContextMenu
        path={path}
        isFolder
        expanded={expanded}
        onAutoLayout={onAutoLayoutGroup}
        onAutoLayoutRecursive={onAutoLayoutGroupRecursive}
      >
        <Box
          className={clsx('folder-group-header', styles.groupHeader)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            width: '100%',
            height: 36,
            px: '10px',
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: 'background.default',
            borderRadius: '6px 6px 0 0',
            fontSize: 12,
            boxSizing: 'border-box',
            pointerEvents: 'auto',
            cursor: 'pointer',
          }}
        >
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
          <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {label}
          </Box>
        </Box>
      </NodeContextMenu>
      <Handle type="source" position={Position.Right} className={styles.groupHandle} />
    </Box>
  );
}
