import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '../../drizzle/schema.js';

const sqlite = new Database(process.env.DATABASE_URL || './data/partselect.db');
export const db = drizzle(sqlite, { schema });

export * from '../../drizzle/schema.js';