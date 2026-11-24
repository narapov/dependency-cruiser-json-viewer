# Contributing

Thanks for your interest in contributing to dependency-cruiser-json-viewer.

By participating, you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Getting started

Requires **Node.js 24+** (see `engines` in `package.json`).

1. Fork the repository on GitHub.
2. Clone your fork and install dependencies:

```bash
git clone https://github.com/<your-username>/dependency-cruiser-json-viewer.git
cd dependency-cruiser-json-viewer
npm ci
```

3. Start the Vite dev server:

```bash
npm run dev
```

By default, cruise watch is off (`CRUISE_WATCH=false` in [`.env.development`](.env.development)). You can load a cruise JSON file from the command palette as usual.

## Watch mode (local development)

To reload the sample cruise JSON when it changes on disk while developing this repository:

1. Set `CRUISE_WATCH=true` in [`.env.development`](.env.development) (only the literal value `true` enables watch).
2. Refresh the sample cruise JSON if needed: `npm run depcruise:json-for-cli` (or `npm run watch-src-and-regenerate-cruise-result-for-cli` to regenerate it when `src/` changes).
3. Start the Vite dev server: `npm run dev`.

With `CRUISE_WATCH=false` (the default) or any value other than `true`, `npm run dev` runs without cruise watch.

For the published CLI `--watch` / `-w` flag, see [Watch mode](README.md#watch-mode) in the README.

## Scripts

| Command                                                  | Description                                                                                                          |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`                                            | Start Vite dev server (serves `test-data/cruise-result.json`; cruise watch via `CRUISE_WATCH` in `.env.development`) |
| `npm run build`                                          | Type-check (`tsc`) and build for production                                                                          |
| `npm run build:gh-pages`                                 | Production build with GitHub Pages base path + embed cruise result in `dist/`                                        |
| `npm run preview`                                        | Preview production build                                                                                             |
| `npm run test`                                           | Run Vitest suite                                                                                                     |
| `npm run lint`                                           | Run ESLint                                                                                                           |
| `npm run lint:fix`                                       | Run ESLint with autofix                                                                                              |
| `npm run format`                                         | Format all files with Prettier                                                                                       |
| `npm run format:check`                                   | Check formatting (CI-friendly)                                                                                       |
| `npm run depcruise`                                      | Run dependency-cruiser on `src` (validate layer rules)                                                               |
| `npm run depcruise:json`                                 | Export cruise result to `./cruise-result.json`                                                                       |
| `npm run depcruise:json-for-cli`                         | Export cruise result (`src` + `invalid_samples`, sample config) to `test-data/cruise-result.json`                    |
| `npm run depcruise:json-for-gh-pages`                    | Export cruise result (`src` + `invalid_samples`, sample config) to `dist/cruise-result.json`                         |
| `npm run watch-src-and-regenerate-cruise-result-for-cli` | Regenerate `test-data/cruise-result.json` when `src/` changes                                                        |
| `npm run cli:verify`                                     | Build, refresh `test-data/cruise-result.json`, start CLI server                                                      |

## Architecture and conventions

- Layers, import rules, and project conventions: [docs/architecture.md](docs/architecture.md)
- Graph algorithms: [docs/algorithms/](docs/algorithms/) ([buildGraph](docs/algorithms/build-graph.md), [libavoid](docs/algorithms/libavoid-edge-routing.md))
- Agent-oriented coding guide (file layout, testing, i18n): [AGENTS.md](AGENTS.md)

Git hooks are installed automatically via `npm ci` (`prepare` → husky):

- **pre-commit:** ESLint (`--fix --max-warnings=0`) and Prettier on staged files via lint-staged
- **commit-msg:** [Conventional Commits](https://www.conventionalcommits.org/) enforced by commitlint (`type: subject`, e.g. `feat: add quick pick`)

## Pull requests

We prefer contributions via **fork and pull request** into `main`.

1. Create a branch from an up-to-date `main`.
2. Make focused changes; keep the diff minimal.
3. Use Conventional Commit messages (see above).
4. Before opening a PR, run:

   1. `npm run lint`
   2. `npm run format:check`
   3. `npm run test`
   4. `npm run depcruise` (if imports or layer boundaries changed)
   5. `npm run build` (for non-trivial changes)

5. Open a PR against `main` and describe the change and how to verify it.

## Security

Please do not report security vulnerabilities through public GitHub issues, discussions, or pull requests. See [SECURITY.md](SECURITY.md) for how to report privately.
