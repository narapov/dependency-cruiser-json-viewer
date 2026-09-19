import { describe, expect, it } from 'vitest';

import { severityChipColor } from './severityChipColor';

describe('severityChipColor', () => {
  it('maps known severities to MUI Chip colors', () => {
    expect(severityChipColor('error')).toBe('error');
    expect(severityChipColor('warn')).toBe('warning');
    expect(severityChipColor('info')).toBe('info');
  });

  it('maps ignore and unknown severities to default', () => {
    expect(severityChipColor('ignore')).toBe('default');
  });
});
