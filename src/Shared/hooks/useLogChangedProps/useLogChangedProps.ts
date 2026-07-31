import { useRef } from 'react';

import { NEED_PROFILE } from '../../constants/needProfile';

export function useLogChangedProps(label: string, props: Record<string, unknown>): void {
  const prevRef = useRef<Record<string, unknown> | null>(null);

  if (!NEED_PROFILE) {
    return;
  }

  /* eslint-disable react-hooks/refs -- intentional previous-props compare during render */
  const prev = prevRef.current;
  if (prev !== null) {
    const changed = Object.keys(props).filter(key => !Object.is(prev[key], props[key]));
    if (changed.length > 0) {
      console.log(`[${label}] props changed:`, changed);
    } else {
      console.log(`[${label}] re-render, no props changed`);
    }
  }

  prevRef.current = props;
  /* eslint-enable react-hooks/refs */
}
