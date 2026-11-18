import Database from 'better-sqlite3';
import type { Database as DatabaseType } from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

let currentDb: DatabaseType | null = null;

export function initDatabase(dbPath?: string): DatabaseType {
  let file: string;
  if (dbPath) {
    file = dbPath;
  } else if (process.env.DB_PATH) {
    file = process.env.DB_PATH;
  } else if (process.env.DATA_DIR) {
    mkdirSync(process.env.DATA_DIR, { recursive: true });
    file = join(process.env.DATA_DIR, 'data.db');
  } else {
    file = 'data.db';
  }
  const db = new Database(file);

  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Create tables on boot if missing
  db.exec(`
    CREATE TABLE IF NOT EXISTS components (
      slug TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT NOT NULL,
      version TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS props (
      component_slug TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('text', 'color', 'range')),
      default_value TEXT NOT NULL,
      min REAL,
      max REAL,
      step REAL,
      unit TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (component_slug, name),
      FOREIGN KEY (component_slug) REFERENCES components(slug) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS presets (
      id TEXT PRIMARY KEY,
      component_slug TEXT NOT NULL,
      props TEXT NOT NULL,
      theme TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (component_slug) REFERENCES components(slug) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS waitlist (
      email TEXT PRIMARY KEY,
      status TEXT NOT NULL CHECK(status IN ('pending', 'confirmed')),
      token_hash TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS feedback (
      id TEXT PRIMARY KEY,
      message TEXT NOT NULL,
      component_slug TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (component_slug) REFERENCES components(slug) ON DELETE SET NULL
    );
  `);

  currentDb = db;
  return db;
}

export function getDb(): DatabaseType {
  if (!currentDb) {
    return initDatabase();
  }
  return currentDb;
}
