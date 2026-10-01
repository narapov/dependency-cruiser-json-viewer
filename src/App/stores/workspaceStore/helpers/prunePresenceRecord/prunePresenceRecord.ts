/** Keep only paths that are present and pass `isValid`. */
export function prunePresenceRecord(
  record: Record<string, boolean | undefined>,
  isValid: (path: string) => boolean,
): Record<string, boolean | undefined> {
  return Object.fromEntries(Object.entries(record).filter(([path, present]) => present === true && isValid(path)));
}
