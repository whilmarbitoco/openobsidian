import Database from "better-sqlite3"

let testDb: Database.Database | null = null

export function getTestDb(): Database.Database {
  if (!testDb) {
    testDb = new Database(":memory:")
    testDb.pragma("journal_mode = WAL")
    testDb.exec(`
      CREATE TABLE IF NOT EXISTS note_metadata (
        path TEXT PRIMARY KEY,
        title TEXT NOT NULL DEFAULT 'Untitled',
        tags TEXT DEFAULT '[]',
        links TEXT DEFAULT '[]',
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );

      CREATE VIRTUAL TABLE IF NOT EXISTS note_fts USING fts5(
        path UNINDEXED,
        title,
        content,
        tokenize='porter unicode61'
      );
    `)
  }
  return testDb
}

export function closeTestDb() {
  if (testDb) {
    testDb.close()
    testDb = null
  }
}
