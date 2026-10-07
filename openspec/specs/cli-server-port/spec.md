# cli-server-port Specification

## Purpose

Defines how the CLI chooses and binds its HTTP listen port, including interactive recovery when the default port is already in use and fail-fast behavior when a port is set explicitly.

## Requirements

### Requirement: Explicit port fails fast when busy

When the user passes `--port` or `-p`, and that port cannot be bound because it is already in use, the CLI MUST print an error that the port is already in use and MUST exit with a non-zero status. The CLI MUST NOT prompt for an alternate port in that case.

#### Scenario: Explicit port busy exits without prompt

- **WHEN** the CLI is started with `--port` (or `-p`) set to a port that is already in use
- **THEN** the process prints an error that the port is already in use
- **AND** exits with a non-zero status
- **AND** does not ask whether to use another port

### Requirement: Default port busy prompts for next free port on a TTY

When the user does not pass `--port` or `-p`, the CLI uses its default port. If binding that default port fails because it is already in use, and standard input is an interactive TTY, the CLI MUST ask the user whether to use the next free port. The confirm MUST treat affirmative (including default Yes) as acceptance and negative or cancel as rejection.

#### Scenario: Default port busy on TTY offers next free port

- **WHEN** the CLI is started without `--port` / `-p`, the default port is in use, and stdin is a TTY
- **THEN** the CLI prompts whether to use the next free port
- **AND** does not exit solely because the default port was busy until the user answers or cancels

#### Scenario: User declines next free port

- **WHEN** the CLI has prompted for the next free port after a busy default
- **AND** the user declines or cancels the prompt
- **THEN** the process prints an error that the default port is already in use
- **AND** exits with a non-zero status

### Requirement: Accepted next free port binds upward through 65535

When the user accepts the next-free-port prompt, the CLI MUST attempt to bind the lowest available port strictly greater than the default port, scanning upward through port `65535` inclusive, on the same bind host already chosen for the server. On success, the CLI MUST report the running URL using the port that was actually bound. If no free port is found in that range, the CLI MUST exit with a non-zero status and an error.

#### Scenario: Next free port is used after accept

- **WHEN** the default port is busy, the user accepts the next-free-port prompt, and a higher port in `default+1`…`65535` is free
- **THEN** the CLI binds that free port
- **AND** logs the running URL with that bound port

#### Scenario: No free port remains in range

- **WHEN** the user accepts the next-free-port prompt
- **AND** every port from `default+1` through `65535` is unavailable
- **THEN** the CLI exits with a non-zero status
- **AND** reports that no free port was found

### Requirement: Non-interactive default busy fails without prompt

When the user does not pass `--port` or `-p`, the default port is already in use, and standard input is not an interactive TTY, the CLI MUST NOT prompt. It MUST print an error that the port is already in use and MUST exit with a non-zero status.

#### Scenario: Non-TTY default busy exits like today

- **WHEN** the CLI is started without `--port` / `-p`, the default port is in use, and stdin is not a TTY
- **THEN** the process prints an error that the port is already in use
- **AND** exits with a non-zero status
- **AND** does not wait for interactive input
