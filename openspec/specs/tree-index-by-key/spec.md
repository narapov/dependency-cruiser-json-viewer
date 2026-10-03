# tree-index-by-key Specification

## Purpose

Defines a reusable domain operation that indexes nested tree nodes into a key→node map using a caller-supplied key derived from each node and its ancestor chain.

## Requirements

### Requirement: Index tree nodes by caller-supplied key

The system SHALL provide a pure operation that accepts a forest of root nodes (each may have optional nested children of the same shape) and a key function, and returns a `Map` from key to node. The walk MUST visit every node reachable via children links and MUST store the same object references as in the input tree (no cloning of nodes). Nodes without children MUST still be indexed.

#### Scenario: Nested nodes are indexed

- **WHEN** roots include a folder with nested children and the key function returns each node's path
- **THEN** the map contains an entry for the folder and for every descendant visited through children
- **AND** map values are the same object references as in the input tree

#### Scenario: Empty forest

- **WHEN** the roots list is empty
- **THEN** the operation returns an empty map

### Requirement: Key function receives ancestor chain

When indexing a node, the system SHALL invoke the key function with that node and its ancestor-node chain ordered nearest parent toward the root. For root nodes the ancestor chain MUST be empty. For a nested node the chain MUST start with its direct parent node object.

#### Scenario: Roots have empty ancestors

- **WHEN** a root node is indexed
- **THEN** the key function is called with an empty ancestors list for that node

#### Scenario: Nested node sees nearest-to-root ancestors

- **WHEN** a child under folder `src` under root `app` is indexed
- **THEN** the key function receives ancestors starting with the `src` node, then the `app` node
- **AND** the key function may use that chain (or ignore it) when computing the key

### Requirement: Duplicate keys last-write

If the key function returns the same key for more than one visited node, the map MUST keep the last visited node for that key (depth-first, children in array order). The operation MUST NOT throw solely because of duplicate keys.

#### Scenario: Later visit overwrites earlier key

- **WHEN** two nodes produce the same key during the walk
- **THEN** the map entry for that key is the later-visited node
