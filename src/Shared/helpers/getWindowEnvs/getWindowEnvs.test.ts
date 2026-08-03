// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';

import { getWindowEnvs } from './getWindowEnvs';

describe('getWindowEnvs', () => {
  afterEach(() => {
    delete window.envs;
  });

  it('returns undefined when window.envs is missing', () => {
    delete window.envs;
    expect(getWindowEnvs()).toBeUndefined();
  });

  it('returns window.envs when set', () => {
    window.envs = { watch: true };
    expect(getWindowEnvs()).toEqual({ watch: true });
  });
});
