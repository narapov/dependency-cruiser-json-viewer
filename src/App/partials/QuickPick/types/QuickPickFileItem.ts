import type { PathSearchTier } from '../helpers/pathSearchTier';

export interface QuickPickFileItem {
  key: string;
  name: string;
  isFolder: boolean;
  parent: string | null;
  tier: PathSearchTier;
}
