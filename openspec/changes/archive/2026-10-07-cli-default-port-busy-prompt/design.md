# Design

## Context

See proposal.md for motivation. Today `bin/dependency-cruiser-json-viewer.mjs` resolves `port` from `--port` / `-p` or `DEFAULT_PORT` (`7347`), creates one `http.Server`, and on `EADDRINUSE` always logs and `process.exit(1)`. Watch mode, static serving, and `/envs.js` are unrelated to this change.

## Goals / Non-Goals

**Goals:**

- Branch only on “port came from CLI flag” vs “default”, not on numeric equality to `7347` after the fact (so changing the default constant stays correct).
- Keep the CLI a single `.mjs` entry with no new npm dependencies.
- Preserve non-interactive and explicit-port fail-fast behavior.

**Non-Goals:**

- Asking the user to type an arbitrary port number.
- Auto-picking a free port without confirm.
- Changing default port value, host binding, or watch/socket behavior.
- Extracting a multi-file CLI package structure (optional later; not required here).

## Decisions

### 1. Detect “explicit port” from parseArgs, not from the number

- **Choice:** Treat the port as explicit when `values.port` was provided (`parseArgs` option present), even if the value equals `DEFAULT_PORT`.
- **Why:** Spec says “if port was passed via parameters, keep current behavior.” Passing `-p 7347` must fail fast when busy.
- **Alternative:** Compare resolved port to `DEFAULT_PORT` — rejected (wrong for `-p 7347`).

### 2. Recover inside the listen error path, then re-listen

- **Choice:** Keep creating the server once. On first `EADDRINUSE` for a non-explicit port with TTY: confirm; on Yes, try `server.listen(candidate, host)` for `DEFAULT_PORT + 1` … `65535` until one succeeds (or none left). On No/cancel/non-TTY/explicit: existing error + exit.
- **Why:** Avoids TOCTOU of a separate probe server; the bind that succeeds is the one served.
- **Alternative:** Probe with a temporary `net.Server` then listen — rejected (race; more code).

### 3. Confirm via `readline` with default Yes

- **Choice:** `readline` question such as `Port ${DEFAULT_PORT} is in use. Use next free port? [Y/n] `; empty / `y` / `yes` (case-insensitive) → accept; `n` / `no` → decline; Ctrl+C → exit non-zero like decline.
- **Why:** Matches agreed UX (option B); zero new deps.
- **Alternative:** `@inquirer/confirm` — rejected (dependency for one prompt).

### 4. Gate prompts on `process.stdin.isTTY`

- **Choice:** Prompt only when `process.stdin.isTTY` is truthy.
- **Why:** `cli:verify`, CI, and pipes must not hang.
- **Alternative:** Always prompt — rejected.

### 5. Success log uses the bound port

- **Choice:** The existing “running at http://localhost:${port}” message (and any listen callback closure) MUST use the port that actually bound after recovery, not the original default.
- **Why:** Spec requires the reported URL to match the listening port.

## Risks / Trade-offs

- **[Risk] Second `listen` after `error` is awkward if the error handler exits too early** → Keep exit only on decline / non-TTY / explicit / exhausted range; do not `exit` before the recovery loop finishes.
- **[Risk] Long scan if many ports are taken** → Unlikely for a local tool; worst case is bounded by `65535 - DEFAULT_PORT`.
- **[Trade-off] English-only CLI prompt** → Consistent with existing CLI error/usage strings (no i18n in `bin/`).

## Migration Plan

- No data migration. Ship with the next package version that includes the updated `bin/` file.
- Rollback: revert the bin change; behavior returns to always-fail on busy port.

## Open Questions

- None for this scope.
