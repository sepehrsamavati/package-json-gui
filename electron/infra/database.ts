import { DatabaseSync } from 'node:sqlite'
import { app } from 'electron'
import path from 'node:path'
import fs from 'node:fs'

export type DatabaseInstance = {
  getDb: () => DatabaseSync
  close: () => void
}

export const createDatabase = (): DatabaseInstance => {
  const userDataPath = app.getPath('userData')
  const dbPath = path.join(userDataPath, 'projects.db')

  // Ensure directories exist
  fs.mkdirSync(userDataPath, { recursive: true })

  const db = new DatabaseSync(dbPath)

  // Initialize table
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      path TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'Web client',
      structure TEXT NOT NULL DEFAULT 'Single Repo',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `)

  // Run alter table queries in try-catch to ensure backward compatibility
  // with databases created under the older schema
  try {
    db.exec(`ALTER TABLE projects ADD COLUMN type TEXT NOT NULL DEFAULT 'Web client';`)
  } catch {
    // Column already exists or error ignored
  }

  try {
    db.exec(`ALTER TABLE projects ADD COLUMN structure TEXT NOT NULL DEFAULT 'Single Repo';`)
  } catch {
    // Column already exists or error ignored
  }

  return {
    getDb: () => db,
    close: () => {
      db.close()
    },
  }
}
