import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as SQLite from 'expo-sqlite';
import * as schema from './schema';

export const sqlite = SQLite.openDatabaseSync('myrutin.db');

export const db = drizzle(sqlite, { schema });
