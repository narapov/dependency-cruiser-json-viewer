import type { SeverityType } from 'dependency-cruiser';

/** Map dependency-cruiser rule severity to an MUI Chip color. */
export function severityChipColor(severity: SeverityType): 'error' | 'warning' | 'info' | 'default' {
  switch (severity) {
    case 'error':
      return 'error';
    case 'warn':
      return 'warning';
    case 'info':
      return 'info';
    default:
      return 'default';
  }
}
