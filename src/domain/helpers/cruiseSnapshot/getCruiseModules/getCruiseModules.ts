import type { IModule } from 'dependency-cruiser';

import type { CruiseSnapshot } from '../../../types';

/** Cruise modules behind the snapshot module paths, or behind `paths` when given. */
export function getCruiseModules(snapshot: CruiseSnapshot, paths?: readonly string[]): IModule[] {
  return (paths ?? snapshot.descendantFiles).flatMap(path => {
    const module = snapshot.nodes.get(path)?.module;
    return module != null ? [module] : [];
  });
}
