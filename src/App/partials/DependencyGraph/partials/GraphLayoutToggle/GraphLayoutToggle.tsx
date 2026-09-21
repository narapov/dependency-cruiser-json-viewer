import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Switch from '@mui/material/Switch';
import Tooltip from '@mui/material/Tooltip';

import type { GraphEdgeStyle } from '@/domain';

interface GraphLayoutToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  edgeStyle: GraphEdgeStyle;
  onEdgeStyleChange: (edgeStyle: GraphEdgeStyle) => void;
}

const EDGE_STYLE_OPTIONS: { value: GraphEdgeStyle; labelKey: string }[] = [
  { value: 'bezier', labelKey: 'graph.edgeStyleBezier' },
  { value: 'orthogonal', labelKey: 'graph.edgeStyleOrthogonal' },
  { value: 'straight', labelKey: 'graph.edgeStyleStraight' },
];

export function GraphLayoutToggle(props: GraphLayoutToggleProps) {
  const { checked, onChange, edgeStyle, onEdgeStyleChange } = props;

  const { t } = useTranslation();
  const label = t('graph.autoLayoutOnly');
  const hint = t('graph.autoLayoutOnlyHint');
  const edgeStyleLabel = t('graph.edgeStyle');

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
        <InputLabel id="graph-edge-style-label" sx={{ fontSize: 12 }}>
          {edgeStyleLabel}
        </InputLabel>
        <Select
          labelId="graph-edge-style-label"
          label={edgeStyleLabel}
          value={edgeStyle}
          onChange={event => onEdgeStyleChange(event.target.value as GraphEdgeStyle)}
          sx={{ fontSize: 12 }}
        >
          {EDGE_STYLE_OPTIONS.map(option => (
            <MenuItem key={option.value} value={option.value} sx={{ fontSize: 12 }}>
              {t(option.labelKey)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
