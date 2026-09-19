import type { SeverityType } from 'dependency-cruiser';

export interface RuleViolationsPickerOption {
  name: string;
  severity: SeverityType;
  violationCount: number;
}
