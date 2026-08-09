/* eslint-disable no-restricted-syntax -- sample barrel exports a function for demo */
import { peerBeta } from '../beta';

/** Intentional peer cross-import (warn) sample. */
export function peerAlpha(): string {
  return `peer-alpha->${peerBeta()}`;
}
