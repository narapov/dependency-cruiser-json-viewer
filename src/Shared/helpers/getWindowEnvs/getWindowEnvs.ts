/** Read runtime `window.envs` injected by `/envs.js`. */
export function getWindowEnvs(): WindowEnvs | undefined {
  return window.envs;
}
