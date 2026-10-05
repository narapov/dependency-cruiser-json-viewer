# buildGraph

Layout is bottom-up per folder: recurse to size children first, then place siblings (layout cache when membership matches, otherwise ELK layered RIGHT), fold parent size, unwind. A cache hit skips ELK for that group only.

Runs in a worker via [`useBuildGraph`](../../src/App/partials/DependencyGraph/partials/GraphCanvas/hooks/useBuildGraph/useBuildGraph.ts).

Implementation: [`buildGraph.ts`](../../src/App/partials/DependencyGraph/partials/GraphCanvas/helpers/buildGraph/buildGraph.ts), [`layoutGroup.ts`](../../src/App/partials/DependencyGraph/partials/GraphCanvas/helpers/buildGraph/layoutGroup/layoutGroup.ts).

## Overview

```mermaid
flowchart LR
  Start([Start])
  S1[1. Collect visible edges]
  S2[2. Recursive per-folder layout]
  S3[3. Index + freeze ports]
  End([End])
  Start --> S1 --> S2 --> S3 --> End
```

## Detail

```mermaid
flowchart TD
  Start([Start])
  In[Snapshot + selection + visibleTree + layoutCache]
  Edges[Collect edges for visible tree + selection]
  EnterGroup[Enter sibling group]
  NextSibling[Next sibling]
  HasKids{node has children?}
  Recurse[Recurse into children group]
  LeafSize[Size leaf by label]
  AllSized{all siblings sized?}
  CacheHit{cache membership matches?}
  Apply[Apply cached positions + settle overlaps]
  Elk[ELK layered RIGHT on siblings]
  Fold[Fold group size from children bounds]
  MoreGroups{return to parent group?}
  Index[Index nodes by path]
  CacheOut[Serialize visible group layouts]
  Ports[Freeze EAST/WEST ports on edges]
  Out[BuildGraphResult]
  End([End])

  Start --> In --> Edges --> EnterGroup --> NextSibling --> HasKids
  HasKids -->|yes| Recurse --> EnterGroup
  HasKids -->|no| LeafSize --> AllSized
  Recurse -->|children laid out| AllSized
  AllSized -->|no| NextSibling
  AllSized -->|yes| CacheHit
  CacheHit -->|yes| Apply --> Fold
  CacheHit -->|no| Elk --> Fold
  Fold --> MoreGroups
  MoreGroups -->|yes parent waiting| EnterGroup
  MoreGroups -->|no root done| Index --> CacheOut --> Ports --> Out --> End
```
