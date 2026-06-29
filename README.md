# dependency-cruiser-json-viewer

Interactive browser viewer for [dependency-cruiser](https://github.com/sverweij/dependency-cruiser) JSON cruise results — explore file trees, dependency graphs, and module relations.

## Motivation

[dependency-cruiser](https://github.com/sverweij/dependency-cruiser) is an excellent tool for understanding how a codebase is wired together. Its built-in output formatters, however, fall short when you need to **explore architecture interactively** — zooming in and out across hierarchy levels, following imports folder by folder, and comparing different views of the same graph.

This is particularly relevant after AI-assisted refactoring, when you need to verify imports and the layered structure on the fly, rather than interrupting your workflow to tweak the configuration and regenerate svg for every session.

The usual workflow meant constantly tweaking filters, `collapsePattern`, and `exclude` rules in `.dependency-cruiser.js`, then waiting for huge SVG files to regenerate. This viewer was born from that pain: load the JSON cruise result once, then navigate the dependency graph in the browser — expand folders, highlight edges, filter modules, and inspect relations without leaving the interactive UI.

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
```

The CLI serves the built viewer from `dist` and streams your JSON file at `/cruise-result.json` without copying it.

## Scripts

| Command                          | Description                                                     |
| -------------------------------- | --------------------------------------------------------------- |
| `npm run dev`                    | Start Vite dev server                                           |
| `npm run build`                  | Type-check and build for production                             |
| `npm run preview`                | Preview production build                                        |
| `npm run test`                   | Run tests                                                       |
| `npm run lint`                   | Run ESLint                                                      |
| `npm run depcruise`              | Run dependency-cruiser on `src`                                 |
| `npm run depcruise:json`         | Export cruise result to `public/cruise-result.json`             |
| `npm run depcruise:json-for-cli` | Export cruise result to `test-data/cruise-result.json`          |
| `npm run cli:verify`             | Build, refresh `test-data/cruise-result.json`, start CLI server |

## License

[MIT](LICENSE)
