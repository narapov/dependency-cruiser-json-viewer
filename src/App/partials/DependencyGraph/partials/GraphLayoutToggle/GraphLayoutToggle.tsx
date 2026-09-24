import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Switch from '@mui/material/Switch';
import Tooltip from '@mui/material/Tooltip';

import type { GraphEdgesType } from '@/domain';

interface GraphLayoutToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  edgesType: GraphEdgesType;
  onEdgesTypeChange: (edgesType: GraphEdgesType) => void;
}

const EDGES_TYPE_OPTIONS: { value: GraphEdgesType; labelKey: string }[] = [
  { value: 'bezier', labelKey: 'graph.edgesTypeBezier' },
  { value: 'straight', labelKey: 'graph.edgesTypeStraight' },
  { value: 'simpleOrthogonal', labelKey: 'graph.edgesTypeSimpleOrthogonal' },
];

export function GraphLayoutToggle(props: GraphLayoutToggleProps) {
  const { checked, onChange, edgesType, onEdgesTypeChange } = props;

  const { t } = useTranslation();
  const label = t('graph.autoLayoutOnly');
  const hint = t('graph.autoLayoutOnlyHint');
  const edgesTypeLabel = t('graph.edgesType');

  return (
    <Box
      sx={{
        p: '4px 10px',
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        fontSize: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 0.75,
      }}
    >
      <Tooltip title={hint}>
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={checked}
              onChange={(_, value) => onChange(value)}
              slotProps={{ input: { 'aria-label': label } }}
            />
          }
          label={label}
          sx={{
            m: 0,
            gap: 0.5,
            '& .MuiFormControlLabel-label': {
              fontSize: 12,
            },
          }}
        />
      </Tooltip>
      <FormControl size="small" fullWidth>
        <InputLabel id="graph-edges-type-label" sx={{ fontSize: 12 }}>
          {edgesTypeLabel}
        </InputLabel>
        <Select
          labelId="graph-edges-type-label"
          label={edgesTypeLabel}
          value={edgesType}
          onChange={event => onEdgesTypeChange(event.target.value as GraphEdgesType)}
          sx={{ fontSize: 12 }}
        >
          {EDGES_TYPE_OPTIONS.map(option => (
            <MenuItem key={option.value} value={option.value} sx={{ fontSize: 12 }}>
              {t(option.labelKey)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
