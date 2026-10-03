# Design

## Context

See proposal.md for motivation. Today:

- `selectEdgesType` → `useAppOrchestration.openEdgesTypePicker` → `graphRef.current?.openEdgesTypePicker()`.
- `DependencyGraph` mounts `GraphCanvas` only when `selectedFilePaths` has a present entry; otherwise it renders `GraphEmptySelection` and the handle is unavailable.
- `EdgesTypePickerDialog` / `useEdgesTypePickerDialog` live under `GraphCanvas/partials` and only write `workspaceStore.graphSettings` — they do not need React Flow.
- App already owns command dialogs (`useThemePickerDialog`, `useLanguagePickerDialog`, etc.) and passes openers into `useAppCommands` as sibling options to `orch`.

## Goals / Non-Goals

**Goals:**

- Make the edges-type picker open from the command palette regardless of graph selection / canvas mount.
- Align ownership with other App command dialogs while keeping the dialog module under the DependencyGraph feature barrel.
- Remove the dead imperative path from `DependencyGraphHandle`.

**Non-Goals:**

- Changing edges-type options, keyboard UX, or persistence schema.
- Showing `GraphLayoutToggle` on the empty-selection screen.
- Composing or merging imperative handles on `DependencyGraph`.
- Always mounting `GraphCanvas` when selection is empty.

## Decisions

### 1. App owns dialog lifecycle; DependencyGraph owns the module

Move `EdgesTypePickerDialog` to `DependencyGraph/partials/EdgesTypePickerDialog/` (sibling of `GraphCanvas` / `GraphEmptySelection`). Re-export `useEdgesTypePickerDialog` from `DependencyGraph/index`. In `App.tsx`, call the hook and render `{edgesTypePickerDialog}` next to the other dialogs.

**Why:** Matches theme/language pickers; opener never depends on canvas mount. Feature code stays under DependencyGraph rather than a new top-level `App/partials` folder.

**Alternatives considered:**

- Compose `DependencyGraphHandle` on `DependencyGraph` and keep opening via `graphRef` — works, but adds handle forwarding for one store-backed dialog and diverges from App's dialog pattern.
- Move dialog to `App/partials/EdgesTypePickerDialog` — also fine, but weaker feature cohesion for a graph setting.

### 2. Pass `openEdgesTypePicker` into `useAppCommands` like other pickers

Remove `openEdgesTypePicker` from `AppCommandsOrchestration` / `useAppOrchestration`. Add it as a top-level option on `useAppCommands` (alongside `openThemePicker`). Wire `App` to pass the hook's opener.

**Why:** Orchestration stays for workspace/graph-ref actions; UI pickers stay App-local.

### 3. Drop `openEdgesTypePicker` from `DependencyGraphHandle`

Remove from the handle type, `useDependencyGraphImperativeRef`, and `GraphCanvas`. Canvas keeps layout/export/focus APIs only.

**Why:** After lift, nothing on the canvas needs to open this dialog.

### 4. Import path / store relative paths

After the move, update `useWorkspaceStore` imports inside the dialog (depth relative to `DependencyGraph/partials` vs previous `GraphCanvas/partials`). Prefer `@/` aliases if already used nearby; otherwise fix relative depth. Public consumers import only from `partials/DependencyGraph` (barrel).

## Risks / Trade-offs

- **[Risk] Tests still assert graph-ref delegation** → Update orchestration / GraphCanvas / commands tests to match App-owned opener; keep a focused test that the command invokes the App-passed opener (empty selection is covered by removing the graph-ref dependency).
- **[Trade-off] DependencyGraph barrel exports a dialog hook App mounts** → Slightly widens the module's public surface; acceptable and intentional for feature ownership.

## Migration Plan

Pure UI wiring refactor. No workspace file format or settings schema changes. Deploy is a normal frontend release; rollback is revert.
