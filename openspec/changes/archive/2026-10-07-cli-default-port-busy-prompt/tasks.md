# Tasks

## 1. Listen recovery in CLI bin

- [x] 1.1 Track whether `--port` / `-p` was provided via `parseArgs` (`values.port` present), and verify `-p 7347` is treated as explicit (no recovery prompt when busy)
- [x] 1.2 On `EADDRINUSE` for a non-explicit port with `stdin.isTTY`: prompt `Use next free port? [Y/n]` via `readline` (default Yes); on decline/cancel print the busy-port error and exit non-zero; verify both Yes (empty/`y`) and No/`Ctrl+C` paths manually against a held default port
- [x] 1.3 After accept, re-`listen` on candidates from `DEFAULT_PORT + 1` through `65535` on the same host until one binds; log the running URL with the bound port; if none bind, exit non-zero with a clear error; verify recovery lands on the next free port when `DEFAULT_PORT` is held
- [x] 1.4 Keep fail-fast (error + non-zero exit, no prompt) when the port is explicit or when stdin is not a TTY; verify with `--port` busy and with a non-TTY invocation (e.g. piped stdin) while the default port is held

## 2. Integration check

- [x] 2.1 Run `npm run format:check` on the touched bin file (or `npm run format` if needed) and a smoke `node bin/dependency-cruiser-json-viewer.mjs test-data/cruise-result.json` when the default port is free; verify the server still starts and prints the usual URL
