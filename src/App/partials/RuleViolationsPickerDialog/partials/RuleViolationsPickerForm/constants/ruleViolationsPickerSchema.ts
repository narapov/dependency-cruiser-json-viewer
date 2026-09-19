import { array, object, string } from 'zod';

/** Zod schema for the rule-violations picker form. */
export const ruleViolationsPickerSchema = object({
  selectedRules: array(string()).min(1),
});
