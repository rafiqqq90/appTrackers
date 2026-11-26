/**
 * Web preview uses localStorage adapters (*.web.ts) so SQLite WASM headers
 * are not required in browser preview. Native iOS/Android use init.ts (expo-sqlite).
 */
export function initializeDatabase(): void {
  // No-op on web
}
