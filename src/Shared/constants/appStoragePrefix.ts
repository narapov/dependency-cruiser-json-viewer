/** Prefix for app keys in localStorage (package name). */
export const APP_STORAGE_PREFIX = __PACKAGE_NAME__;

/** Build a namespaced localStorage key for the app. */
export function appStorageKey(suffix: string): string {
  return `${APP_STORAGE_PREFIX}.${suffix}`;
}
