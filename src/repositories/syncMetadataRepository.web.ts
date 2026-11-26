const META_PREFIX = 'myrutin_meta_';

export const syncMetadataRepository = {
  get(key: string): string | null {
    try {
      return globalThis.localStorage?.getItem(META_PREFIX + key) ?? null;
    } catch {
      return null;
    }
  },

  set(key: string, value: string): void {
    try {
      globalThis.localStorage?.setItem(META_PREFIX + key, value);
    } catch {
      // ignore
    }
  },
};
