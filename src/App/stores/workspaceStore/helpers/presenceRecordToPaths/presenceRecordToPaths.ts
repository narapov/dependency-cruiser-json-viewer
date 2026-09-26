/** Collect paths marked present (`true`) in a sparse presence record. */
export function presenceRecordToPaths(record: Record<string, boolean | undefined>): string[] {
  return Object.entries(record)
    .filter(([, present]) => present)
    .map(([path]) => path);
}
