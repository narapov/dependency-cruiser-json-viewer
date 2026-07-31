/** Creates a no-op or timing profiler for `buildGraph` stages. */
export function createBuildGraphProfiler(enabled: boolean) {
  const marks = new Map<string, number>();
  const totals = new Map<string, number>();

  return {
    start(label: string) {
      if (!enabled) {
        return;
      }
      marks.set(label, performance.now());
    },
    end(label: string) {
      if (!enabled) {
        return;
      }
      const startedAt = marks.get(label);
      if (startedAt === undefined) {
        return;
      }
      marks.delete(label);
      totals.set(label, (totals.get(label) ?? 0) + (performance.now() - startedAt));
    },
    log(meta: { nodes: number; edges: number; selected: number }) {
      if (!enabled) {
        return;
      }
      const lines = [...totals.entries()].map(([label, ms]) => `  ${label}: ${ms.toFixed(1)}ms`).join('\n');
      console.log(`[buildGraph] selected=${meta.selected} nodes=${meta.nodes} edges=${meta.edges}\n${lines}`);
    },
  };
}

/** Profiler returned by `createBuildGraphProfiler`. */
export type BuildGraphProfiler = ReturnType<typeof createBuildGraphProfiler>;
