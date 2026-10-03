# graph-edges-type-picker Specification

## Purpose

Lets users choose how dependency edges are drawn via a command-opened picker, including when the graph canvas is not mounted because no files are selected.

## Requirements

### Requirement: Edges type picker opens without graph selection

The system SHALL open the graph edges-type picker when the user runs the select-edges-type command, whether or not any files are selected for the dependency graph. Opening the picker MUST NOT require the graph canvas to be mounted.

#### Scenario: Command opens picker with empty graph selection

- **WHEN** no files are selected for the dependency graph
- **AND** the user executes the select-edges-type command
- **THEN** the edges-type picker dialog is shown

#### Scenario: Command opens picker with graph selection

- **WHEN** one or more files are selected for the dependency graph
- **AND** the user executes the select-edges-type command
- **THEN** the edges-type picker dialog is shown

### Requirement: Edges type selection updates workspace graph settings

When the user confirms an edges type in the picker, the system SHALL persist that type in workspace graph settings so subsequent graph rendering uses the chosen edges type.

#### Scenario: User selects an edges type

- **WHEN** the edges-type picker is open
- **AND** the user selects an edges type option
- **THEN** workspace graph settings store that edges type
- **AND** the picker closes
