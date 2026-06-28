# dependency-cruiser-json-viewer

Interactive browser viewer for [dependency-cruiser](https://github.com/sverweij/dependency-cruiser) JSON cruise results — explore file trees, dependency graphs, and module relations.

## Motivation

[dependency-cruiser](https://github.com/sverweij/dependency-cruiser) is an excellent tool for understanding how a codebase is wired together. Its built-in output formatters, however, fall short when you need to **explore architecture interactively** — zooming in and out across hierarchy levels, following imports folder by folder, and comparing different views of the same graph.

This is particularly relevant after AI-assisted refactoring, when you need to verify imports and the layered structure on the fly, rather than interrupting your workflow to tweak the configuration and regenerate svg for every session.

The usual workflow meant constantly tweaking filters, `collapsePattern`, and `exclude` rules in `.dependency-cruiser.js`, then waiting for huge SVG files to regenerate. This viewer was born from that pain: load the JSON cruise result once, then navigate the dependency graph in the browser — expand folders, highlight edges, filter modules, and inspect relations without leaving the interactive UI.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview production build |
| `npm run test` | Run tests |
| `npm run lint` | Run ESLint |
| `npm run depcruise` | Run dependency-cruiser on `src` |
| `npm run depcruise:json` | Export cruise result to `public/cruise-result.json` |

## License

[MIT](LICENSE)
