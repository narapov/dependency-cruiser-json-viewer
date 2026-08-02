import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import ChevronRight from '@mui/icons-material/ChevronRight';
import ExpandMore from '@mui/icons-material/ExpandMore';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';

import type { ModuleRelation } from '@/domain';

import { countRelationLeaves, initialExpandedKeys, toggleExpandedKey } from '../../helpers';
import { RelationRow } from '../RelationRow';

interface HiddenRelationsSectionProps {
  hiddenItems: ModuleRelation[];
  onShowInGraph: (path: string) => void;
}

/** Collapsible section listing relations filtered out of the main list. */
export function HiddenRelationsSection({ hiddenItems, onShowInGraph }: HiddenRelationsSectionProps) {
  const { t } = useTranslation();
  const [hiddenExpandedKeys, setHiddenExpandedKeys] = useState(() => initialExpandedKeys(hiddenItems, 'hidden:'));
  const [hiddenSectionOpen, setHiddenSectionOpen] = useState(false);

  const hiddenCount = countRelationLeaves(hiddenItems);
  if (hiddenCount === 0) {
    return null;
  }

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.25,
          py: 0.25,
          cursor: 'pointer',
          userSelect: 'none',
        }}
        onClick={() => setHiddenSectionOpen(open => !open)}
        role="button"
        aria-expanded={hiddenSectionOpen}
        aria-label={hiddenSectionOpen ? t('actions.collapse') : t('actions.expand')}
      >
        <Typography component="span" variant="body2" sx={{ flex: 1, fontWeight: 500 }}>
          {t('dependencyPanel.hidden', { count: hiddenCount })}
        </Typography>
        <IconButton size="small" aria-hidden tabIndex={-1} sx={{ width: 24, height: 24, pointerEvents: 'none' }}>
          {hiddenSectionOpen ? <ExpandMore sx={{ fontSize: 16 }} /> : <ChevronRight sx={{ fontSize: 16 }} />}
        </IconButton>
      </Box>
      <Collapse in={hiddenSectionOpen} unmountOnExit>
        <List dense disablePadding>
          {hiddenItems.map(item => {
            const expandKey = `hidden:${item.path}`;
            return (
              <RelationRow
                key={expandKey}
                item={item}
                expandKey={expandKey}
                expandedKeys={hiddenExpandedKeys}
                onToggleExpand={key => setHiddenExpandedKeys(prev => toggleExpandedKey(prev, key))}
                onShowInGraph={onShowInGraph}
                depth={0}
              />
            );
          })}
        </List>
      </Collapse>
    </Box>
  );
}
