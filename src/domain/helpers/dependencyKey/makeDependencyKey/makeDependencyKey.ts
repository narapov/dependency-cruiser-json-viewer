/** Canonical `source->target` key for a module dependency. */
export function makeDependencyKey(source: string, target: string): string {
  return `${source}->${target}`;
}
