import CircularProgress from '@mui/material/CircularProgress';

import { CruiseResultDropOverlay } from '../CruiseResultDropOverlay';

import styles from './CruiseResultLoading.module.css';

export interface CruiseResultLoadingProps {
  isDraggingFile: boolean;
  isDropAllowed: boolean;
}

/**
 * Full-screen spinner while cruise result is pending or hydrating into the workspace.
 */
export function CruiseResultLoading(props: CruiseResultLoadingProps) {
  const { isDraggingFile, isDropAllowed } = props;

  return (
    <div className={styles.centered}>
      <CircularProgress size={32} />
      <CruiseResultDropOverlay open={isDraggingFile} allowed={isDropAllowed} />
    </div>
  );
}
