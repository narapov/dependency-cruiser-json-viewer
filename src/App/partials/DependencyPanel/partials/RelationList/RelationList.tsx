import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';

import type { ModuleRelation } from '@/domain';

import { initialExpandedKeys, toggleExpandedKey } from './helpers';
import { HiddenRelationsSection } from './partials/HiddenRelationsSection';
import { RelationRow } from './partials/RelationRow';

interface RelationListProps {
  items: ModuleRelation[];
  hiddenItems?: ModuleRelation[];
  onShowInGraph: (path: string) => void;
}

export function RelationList({ items, hiddenItems = [], onShowInGraph }: RelationListProps) {
  const { t } = useTranslation();
  const [expandedKeys, setExpandedKeys] = useState(() => initialExpandedKeys(items, ''));

  const isEmpty = items.length === 0 && hiddenItems.length === 0;

  if (isEmpty) {
    return (
      <Typography color="text.secondary" align="center" sx={{ py: 2 }}>
        {t('dependencyPanel.noDependencies')}
      </Typography>
    );
  }

  return (
    <Box>
      {items.length > 0 ? (
        <List dense disablePadding>
          {items.map(item => {
            const expandKey = item.path;
            return (
              <RelationRow
                key={item.path}
                item={item}
                expandKey={expandKey}
                expandedKeys={expandedKeys}
                onToggleExpand={key => setExpandedKeys(prev => toggleExpandedKey(prev, key))}
                onShowInGraph={onShowInGraph}
                depth={0}
              />
            );
          })}
        </List>
      ) : null}

      {hiddenItems.length > 0 ? (
        <Box sx={{ mt: items.length > 0 ? 0.5 : 0 }}>
          <HiddenRelationsSection hiddenItems={hiddenItems} onShowInGraph={onShowInGraph} />
        </Box>
      ) : null}
    </Box>
  );
}
