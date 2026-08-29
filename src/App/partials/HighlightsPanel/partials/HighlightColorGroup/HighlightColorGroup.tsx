import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import ChevronRight from '@mui/icons-material/ChevronRight';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import ExpandMore from '@mui/icons-material/ExpandMore';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { parseDependencyKey } from '@/domain';

interface HighlightColorGroupProps {
  color: string;
  keys: readonly string[];
  onRemoveDependencyKeys: (keys: readonly string[]) => void;
  onShowConnection: (source: string, target: string) => void;
}

export function HighlightColorGroup({
  color,
  keys,
  onRemoveDependencyKeys,
  onShowConnection,
}: HighlightColorGroupProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(true);

  return (
    <>
      <ListItem
        disableGutters
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 1,
          bgcolor: 'background.paper',
          display: 'flex',
          alignItems: 'center',
          gap: 0.25,
          py: 0.25,
          px: 1,
          borderRadius: 1,
        }}
      >
        <IconButton
          size="small"
          aria-label={expanded ? t('actions.collapse') : t('actions.expand')}
          onClick={() => setExpanded(open => !open)}
          sx={{ flexShrink: 0, p: 0.25 }}
        >
          {expanded ? <ExpandMore fontSize="small" /> : <ChevronRight fontSize="small" />}
        </IconButton>
        <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', flex: 1, minWidth: 0 }}>
          <Box
            aria-hidden
            sx={{
              width: 14,
              height: 14,
              borderRadius: 0.5,
              bgcolor: color,
              border: '1px solid',
              borderColor: 'divider',
              flexShrink: 0,
            }}
          />
          <Chip size="small" label={keys.length} sx={{ height: 20, fontSize: 11, flexShrink: 0 }} />
        </Stack>
        <IconButton
          size="small"
          aria-label={t('highlights.removeColor')}
          onClick={() => onRemoveDependencyKeys(keys)}
          sx={{ p: 0.25, flexShrink: 0 }}
        >
          <DeleteOutlinedIcon fontSize="small" />
        </IconButton>
      </ListItem>
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <List dense disablePadding sx={{ pl: 4, pb: 0.5 }}>
          {keys.map(key => {
            const { source, target } = parseDependencyKey(key);
            const label = `${source} → ${target}`;
            return (
              <ListItem
                key={key}
                disableGutters
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.25,
                  py: 0.25,
                  px: 1,
                  borderRadius: 1,
                }}
              >
                <ListItemButton
                  onClick={() => onShowConnection(source, target)}
                  sx={{ borderRadius: 1, py: 0.25, px: 1, flex: 1, minWidth: 0 }}
                >
                  <ListItemText
                    primary={
                      <Typography variant="body2" noWrap title={label} sx={{ fontFamily: 'monospace', fontSize: 13 }}>
                        {label}
                      </Typography>
                    }
                    sx={{ my: 0, minWidth: 0 }}
                  />
                </ListItemButton>
                <IconButton
                  size="small"
                  aria-label={t('highlights.removeConnection')}
                  onClick={() => onRemoveDependencyKeys([key])}
                  sx={{ p: 0.25, flexShrink: 0 }}
                >
                  <DeleteOutlinedIcon fontSize="small" />
                </IconButton>
              </ListItem>
            );
          })}
        </List>
      </Collapse>
    </>
  );
}
