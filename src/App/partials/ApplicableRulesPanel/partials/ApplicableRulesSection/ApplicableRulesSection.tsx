import Box from '@mui/material/Box';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';

import type { RuleWithViolations } from '@/domain';

import { ApplicableRuleListItem } from '../ApplicableRuleListItem';

interface ApplicableRulesSectionProps {
  title: string;
  entries: RuleWithViolations[];
  onSelectViolationPaths: (paths: string[]) => void;
}

export function ApplicableRulesSection({ title, entries, onSelectViolationPaths }: ApplicableRulesSectionProps) {
  if (entries.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mb: 1 }}>
      <Typography variant="subtitle2" color="text.secondary" sx={{ px: 1, py: 0.75 }}>
        {title} ({entries.length})
      </Typography>
      <List dense disablePadding>
        {entries.map(entry => (
          <ApplicableRuleListItem key={entry.name} entry={entry} onSelectViolationPaths={onSelectViolationPaths} />
        ))}
      </List>
    </Box>
  );
}
