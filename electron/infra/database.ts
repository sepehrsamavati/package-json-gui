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
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `)

  return {
    getDb: () => db,
    close: () => {
      db.close()
    },
  }
}
