# Tasks

## 1. Relocate dialog module

- [x] 1.1 Move `EdgesTypePickerDialog` (component, hook, tests, barrel) from `GraphCanvas/partials/` to `DependencyGraph/partials/EdgesTypePickerDialog/` and fix store/import paths; verify the existing hook test still passes (`npm run test -- useEdgesTypePickerDialog`)
- [x] 1.2 Re-export `useEdgesTypePickerDialog` from `DependencyGraph/index.ts` and verify TypeScript resolves the export from `@/App`-style / `./partials/DependencyGraph` import sites used by App

## 2. Wire App opener; detach from graph handle

- [x] 2.1 Remove dialog usage and `openEdgesTypePicker` from `GraphCanvas` and `useDependencyGraphImperativeRef`; drop `openEdgesTypePicker` from `DependencyGraphHandle`; verify GraphCanvas tests that touched the handle still pass without that method
- [x] 2.2 In `App.tsx`, call `useEdgesTypePickerDialog` from `partials/DependencyGraph`, render `{edgesTypePickerDialog}` with the other dialogs, and pass `openEdgesTypePicker` into `useAppCommands`; remove `openEdgesTypePicker` from `useAppOrchestration` / `AppCommandsOrchestration`; update orchestration and commands tests so `selectEdgesType` invokes the App-passed opener (not `graphRef`)

## 3. Verification

- [x] 3.1 Run `npm run lint`, `npm run format:check`, and `npm run test` for touched areas; manually confirm the select-edges-type command opens the dialog when the graph shows empty selection
