# Spec Delta

## Purpose

Defines how QuickPick and PathSearchDialog build, rank, and display file/folder search items from cruise snapshot path topology without reparsing loaded paths for parent or tier.

## ADDED Requirements

### Requirement: Search items carry snapshot parent

When building searchable file and folder items from a cruise snapshot, the system SHALL set each item's parent to the corresponding path node's `parent` value (`null` for roots). Items MUST include the node's path key, display name, and folder flag. Consumers MUST NOT re-derive parent by parsing the item key with path-string utilities after the snapshot is loaded.

#### Scenario: Nested file parent from snapshot node

- **WHEN** search items are built from a snapshot that includes `src/components/App.tsx` with node parent `src/components`
- **THEN** the item for `src/components/App.tsx` has parent `src/components`

#### Scenario: Root item has null parent

- **WHEN** search items are built from a snapshot that includes a root path such as `src`
- **THEN** the item for that root has parent `null`

### Requirement: Path search tiers use snapshot topology

Path search ranking tiers (src, lib, other, node_modules) MUST be determined from the path node's identity and `ancestors` (or equivalent fields copied onto the search item at build time), detecting folder segments such as `src`, `lib`, and `node_modules` as full ancestor paths or the node path itself. Classification MUST NOT split the leaf path string solely to discover those segments at search or render time. Priority order MUST remain: src over lib over other over node_modules when multiple apply, matching existing ranking multipliers.

#### Scenario: Nested src under packages ranks as src

- **WHEN** a path such as `packages/app/src/main.ts` is classified for search ranking
- **THEN** its tier is src because an ancestor path ends with `/src` or equals `src`

#### Scenario: node_modules demotion

- **WHEN** a path under a `node_modules` folder segment is classified for search ranking
- **THEN** its tier is node_modules

### Requirement: File result rows display item parent

QuickPick and PathSearchDialog file result rows MUST show the secondary path text from the search item's parent field when parent is non-null, and MUST omit that secondary path when parent is null.

#### Scenario: Nested file shows parent path

- **WHEN** a file result item with parent `src/components` is rendered
- **THEN** the row shows `src/components` as the secondary path

#### Scenario: Root file omits secondary path

- **WHEN** a file result item with parent `null` is rendered
- **THEN** the row does not show a secondary parent path
