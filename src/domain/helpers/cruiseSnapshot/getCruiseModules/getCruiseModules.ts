import type { IModule } from 'dependency-cruiser';

import type { CruiseSnapshot } from '../../../types';
import { getCruiseSources } from '../getCruiseSources';

/** Cruise modules behind the snapshot module paths, or behind `paths` when given. */
export function getCruiseModules(snapshot: CruiseSnapshot, paths?: readonly string[]): IModule[] {
  return (paths ?? getCruiseSources(snapshot)).flatMap(path => {
    const module = snapshot.nodes.get(path)?.originModule;
    return module != null ? [module] : [];
  });
}
