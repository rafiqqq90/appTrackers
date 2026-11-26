const KEY = 'theme-mode';

export const themeStorage = {
  get(): string | null {
    try {
      return globalThis.localStorage?.getItem(KEY) ?? null;
    } catch {
      return null;
    }
  },
  set(value: string) {
    try {
      globalThis.localStorage?.setItem(KEY, value);
    } catch {
      // ignore persistence failures
    }
  },
};
