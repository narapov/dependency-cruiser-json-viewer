export const APP_STORAGE_PREFIX = __PACKAGE_NAME__;

export function appStorageKey(suffix: string): string {
  return `${APP_STORAGE_PREFIX}.${suffix}`;
}
