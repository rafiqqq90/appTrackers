import Storage from 'expo-sqlite/kv-store';

const KEY = 'theme-mode';

export const themeStorage = {
  get(): string | null {
    try {
      return Storage.getItemSync(KEY);
    } catch {
      return null;
    }
  },
  set(value: string) {
    try {
      Storage.setItemSync(KEY, value);
    } catch {
      // ignore persistence failures
    }
  },
};
