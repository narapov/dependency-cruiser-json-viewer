import type { IModule } from 'dependency-cruiser';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';

import type { ModuleRelation } from '@/domain';

import { initialExpandedKeys, toggleExpandedKey, type PanelRelationDirection } from './helpers';
import { HiddenRelationsSection } from './partials/HiddenRelationsSection';
import { RelationRow } from './partials/RelationRow';

interface RelationListProps {
  items: ModuleRelation[];
  hiddenItems?: ModuleRelation[];
  panelPath: string;
  modules: IModule[];
  direction: PanelRelationDirection;
  userEdgeHighlights: ReadonlyMap<string, string>;
  onSetUserDependencyHighlight: (dependencyKeys: readonly string[], color: string | null) => void;
  onShowInGraph: (path: string) => void;
}

export function RelationList({
  items,
  hiddenItems = [],
  panelPath,
  modules,
  direction,
  userEdgeHighlights,
  onSetUserDependencyHighlight,
  onShowInGraph,
}: RelationListProps) {
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
                panelPath={panelPath}
                modules={modules}
                direction={direction}
                userEdgeHighlights={userEdgeHighlights}
                onSetUserDependencyHighlight={onSetUserDependencyHighlight}
                onShowInGraph={onShowInGraph}
                depth={0}
              />
            );
          })}
        </List>
      ) : null}

      {hiddenItems.length > 0 ? (
        <Box sx={{ mt: items.length > 0 ? 0.5 : 0 }}>
          <HiddenRelationsSection
            hiddenItems={hiddenItems}
            panelPath={panelPath}
            modules={modules}
            direction={direction}
            userEdgeHighlights={userEdgeHighlights}
            onSetUserDependencyHighlight={onSetUserDependencyHighlight}
            onShowInGraph={onShowInGraph}
          />
        </Box>
      ) : null}
    </Box>
  );
}
