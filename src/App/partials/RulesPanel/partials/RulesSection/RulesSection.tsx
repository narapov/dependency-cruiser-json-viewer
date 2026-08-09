import Box from '@mui/material/Box';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';

import type { RuleWithViolations } from '@/domain';

import { RuleListItem } from '../RuleListItem';

interface RulesSectionProps {
  title: string;
  entries: RuleWithViolations[];
  nameFilter: string;
  onSelectViolationPaths: (paths: string[]) => void;
}

export function RulesSection({ title, entries, nameFilter, onSelectViolationPaths }: RulesSectionProps) {
  if (entries.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mb: 1 }}>
      <Typography variant="subtitle2" color="text.secondary" sx={{ px: 1.5, py: 0.75 }}>
        {title} ({entries.length})
      </Typography>
      <List dense disablePadding>
        {entries.map(entry => (
          <RuleListItem
            key={entry.name}
            entry={entry}
            nameFilter={nameFilter}
            onSelectViolationPaths={onSelectViolationPaths}
          />
        ))}
      </List>
    </Box>
  );
}
