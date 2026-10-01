import type { WorkspaceComputedState } from './WorkspaceComputedState';
import type { WorkspaceOwnState } from './WorkspaceOwnState';
import type { WorkspaceStateActions } from './WorkspaceStateActions';

/** Full workspace store shape: own fields + computed + actions. */
export type WorkspaceState = WorkspaceOwnState & WorkspaceComputedState & WorkspaceStateActions;
