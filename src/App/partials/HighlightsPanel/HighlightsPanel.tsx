import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { groupHighlightsByColor } from '@/domain';

import { HighlightColorGroup } from './partials/HighlightColorGroup';

interface HighlightsPanelProps {
  highlights: ReadonlyMap<string, string>;
  onRemoveDependencyKeys: (keys: readonly string[]) => void;
  onShowConnection: (source: string, target: string) => void;
  onClearAll: () => void;
}

export function HighlightsPanel({
  highlights,
  onRemoveDependencyKeys,
  onShowConnection,
  onClearAll,
}: HighlightsPanelProps) {
  const { t } = useTranslation();
  const groups = groupHighlightsByColor(highlights);
  const isEmpty = groups.length === 0;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {!isEmpty ? (
        <Stack direction="row" sx={{ px: 1, py: 0.5, flexShrink: 0, justifyContent: 'flex-end' }}>
          <Button size="small" color="error" onClick={onClearAll}>
            {t('highlights.clearAll')}
          </Button>
        </Stack>
      ) : null}
      <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', px: 0.5 }}>
        {isEmpty ? (
          <Typography variant="body2" color="text.secondary" sx={{ px: 1, py: 1 }}>
            {t('highlights.empty')}
          </Typography>
        ) : (
          <List dense disablePadding>
            {groups.map(group => (
              <HighlightColorGroup
                key={group.color}
                color={group.color}
                keys={group.keys}
                onRemoveDependencyKeys={onRemoveDependencyKeys}
                onShowConnection={onShowConnection}
              />
            ))}
          </List>
        )}
      </Box>
    </Box>
  );
}
