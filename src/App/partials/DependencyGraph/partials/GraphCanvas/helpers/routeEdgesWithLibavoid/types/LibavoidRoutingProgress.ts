/** Routing progress phase reported to the UI (overlap is a separate phase). */
export type LibavoidRoutingPhase = 'primary' | 'overlap';

export interface LibavoidRoutingProgress {
  phase: LibavoidRoutingPhase;
  completed: number;
  total: number;
}
