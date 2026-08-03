# dependency-cruiser-json-viewer

[![npm version](https://img.shields.io/npm/v/dependency-cruiser-json-viewer.svg)](https://www.npmjs.com/package/dependency-cruiser-json-viewer)

Interactive browser viewer for [dependency-cruiser](https://github.com/sverweij/dependency-cruiser) JSON cruise results — explore file trees, dependency graphs, and module relations.

Built with [React](https://react.dev/), [MUI](https://mui.com/), and [@xyflow/react](https://reactflow.dev/).

## Demo

![demo](https://raw.githubusercontent.com/narapov/dependency-cruiser-json-viewer/main/demo.webp)

Try it live: [https://narapov.github.io/dependency-cruiser-json-viewer/](https://narapov.github.io/dependency-cruiser-json-viewer/)

The demo loads the dependency-cruiser cruise result of this project by default. To explore your own codebase, press **F1** to open the command palette and choose **Load dependency-cruiser JSON** to pick a local `.json` file.

## Motivation

[dependency-cruiser](https://github.com/sverweij/dependency-cruiser) is an excellent tool for understanding how a codebase is wired together. Its built-in output formatters, however, fall short when you need to **explore architecture interactively** — zooming in and out across hierarchy levels, following imports folder by folder, and comparing different views of the same graph.

This is particularly relevant after AI-assisted refactoring, when you need to verify imports and the layered structure on the fly, rather than interrupting your workflow to tweak the configuration and regenerate svg for every session.

The usual workflow meant constantly tweaking filters, `collapsePattern`, and `exclude` rules in `.dependency-cruiser.js`, then waiting for huge SVG files to regenerate. This viewer was born from that pain: load the JSON cruise result once, then navigate the dependency graph in the browser — expand folders, highlight edges, filter modules, and inspect relations without leaving the interactive UI.

## Features

- **File tree** — browse modules and folders; checkbox selection to dynamically show or hide parts of the codebase in the graph; expand/collapse, context menu.
- **Dependency graph** — interactive graph with folder/file nodes and colored edges (incoming/outgoing/circular).
- **Drag-and-drop layout** — rearrange graph nodes by dragging; custom positions persist when you expand or collapse folders. Turn off **Auto layout only** in the graph legend to enable dragging; use **Auto layout** in a folder's context menu to reset layout.
- **Edge highlighting** — highlight dependencies via the edge context menu; highlights are tied to the underlying import relation and persist when you expand or collapse nodes.
- **Drill-down navigation** — expanding a folder in the tree rebuilds the graph for that scope, so you can walk from high-level architecture down to individual files.
- **Quick search & commands** — fuzzy file search (`Cmd/Ctrl+P`) and command palette (`F1`); see Keyboard shortcuts below.
- **DOT export** — export the current graph layout as a Graphviz `.dot` file via the command palette (**Export Graph DOT**), or open it in [Graphviz Online](https://dreampuf.github.io/GraphvizOnline/?engine=nop2) (**View Graph DOT Online**); render locally with `neato -n2 -Tsvg graph.dot` or `dot -Knop2 -Tsvg graph.dot`.
- **Workspace save/load** — save selection, expansion, ignore patterns, edge highlights, folder colors, and layout into the cruise JSON under `dependency-cruiser-json-viewer` (**Save Workspace**). Both **Load dependency-cruiser JSON** (when the file has workspace settings) and **Load Workspace Settings** always clear the current view and replace selection, expansion, the dependencies panel path, ignore patterns, edge highlights, folder colors, and layout from the file, dropping entries that no longer match the relevant cruise data (e.g. references to files or dependencies that no longer exist).
- **Ignore patterns** — glob patterns to exclude modules from tree and graph.

## Keyboard shortcuts

| Shortcut               | Action                                                                                                                           |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **F1**                 | Open the command palette (expand/collapse, theme, language, ignore patterns, load JSON, etc.).                                   |
| **Cmd+P** / **Ctrl+P** | Open quick file search; type to fuzzy-find files/folders, Enter to navigate (expands ancestors, focuses node in tree and graph). |

Typing `>` at the start of the quick-search query switches to command mode (same as F1).

## Usage

Install as a dev dependency and serve your dependency-cruiser JSON output in the browser:

```bash
npm install -D dependency-cruiser-json-viewer
npx depcruise src -T json -f cruise-result.json
npx dependency-cruiser-json-viewer cruise-result.json
# dependency-cruiser-json-viewer is running at http://localhost:7347
```

Optional flags:

```bash
npx dependency-cruiser-json-viewer cruise-result.json --port 9000
# dependency-cruiser-json-viewer is running at http://localhost:9000

npx dependency-cruiser-json-viewer cruise-result.json --watch
# or -w — reload the UI when the cruise JSON file changes
```

The CLI serves the built viewer from `dist` and streams your JSON file at `/cruise-result.json` without copying it.

## Watch mode

When watch mode is on, the viewer reloads `/cruise-result.json` whenever that file changes on disk and re-applies the current workspace (selection, ignore patterns, edge highlights, folder colors, and layout). Manual **Load dependency-cruiser JSON** is disabled while watch is active.

### CLI

```bash
npx dependency-cruiser-json-viewer cruise-result.json --watch
# or
npx dependency-cruiser-json-viewer cruise-result.json -w
```

### Local development (this repository)

1. Set `CRUISE_WATCH=true` in [`.env.development`](.env.development) (only the literal value `true` enables watch).
2. Refresh the sample cruise JSON if needed: `npm run depcruise:json-for-cli` (or `npm run watch-src-and-regenerate-cruise-result-for-cli` to regenerate it when `src/` changes).
3. Start the Vite dev server: `npm run dev`.

With `CRUISE_WATCH=false` (the default in `.env.development`) or any value other than `true`, `npm run dev` runs without cruise watch — you can load a JSON file from the command palette as usual.

## Scripts

| Command                               | Description                                                                                                          |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`                         | Start Vite dev server (serves `test-data/cruise-result.json`; cruise watch via `CRUISE_WATCH` in `.env.development`) |
| `npm run build`                       | Type-check (`tsc`) and build for production                                                                          |
| `npm run build:gh-pages`              | Production build with GitHub Pages base path + embed cruise result in `dist/`                                        |
| `npm run preview`                     | Preview production build                                                                                             |
| `npm run test`                        | Run Vitest suite                                                                                                     |
| `npm run lint`                        | Run ESLint                                                                                                           |
| `npm run lint:fix`                    | Run ESLint with autofix                                                                                              |
| `npm run format`                      | Format all files with Prettier                                                                                       |
| `npm run format:check`                | Check formatting (CI-friendly)                                                                                       |
| `npm run depcruise`                   | Run dependency-cruiser on `src` (validate layer rules)                                                               |
| `npm run depcruise:json`              | Export cruise result to `./cruise-result.json`                                                                       |
| `npm run depcruise:json-for-cli`      | Export cruise result to `test-data/cruise-result.json`                                                               |
| `npm run depcruise:json-for-gh-pages` | Export cruise result to `dist/cruise-result.json`                                                                    |
| `npm run cli:verify`                  | Build, refresh `test-data/cruise-result.json`, start CLI server                                                      |

## License

[MIT](LICENSE)
