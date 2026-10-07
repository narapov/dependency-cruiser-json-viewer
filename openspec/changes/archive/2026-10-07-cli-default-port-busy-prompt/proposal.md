# Proposal

## Why

When the CLI starts without `--port` and the default port `7347` is already in use, it exits immediately with an error. Interactive local use often only needs the next free port; forcing the user to re-run with `-p` is unnecessary friction. Explicit `--port` / `-p` must keep failing fast so scripts and pinned ports stay predictable.

## What Changes

- When the default port is busy, stdin is a TTY, and `--port` / `-p` was not passed: ask whether to use the next free port (confirm, default Yes).
- On Yes: scan upward from `7348` through `65535`, bind the first free port, and log the URL with that port.
- On No, cancel, or non-TTY: keep today’s behavior — print the busy-port error and exit non-zero.
- When `--port` / `-p` is passed: unchanged — busy port always errors and exits (no prompt).

## Capabilities

### New Capabilities

- `cli-server-port`: CLI HTTP listen port selection, including default-port busy recovery via interactive confirm and next-free-port scan.

### Modified Capabilities

- (none)

## Impact

- `bin/dependency-cruiser-json-viewer.mjs` (listen / `EADDRINUSE` handling).
- No new runtime dependencies (stdlib `readline` + port probe).
- Non-interactive flows (`cli:verify`, CI, piped stdin) keep failing without prompting.
