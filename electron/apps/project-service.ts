import { DatabaseInstance } from '../infra/database.js'
import { Project } from '../types.js'

export type ProjectService = {
  getAll: () => readonly Project[]
  create: (name: string, path: string) => Project
}

type Dependencies = {
  database: DatabaseInstance
}

export const createProjectService = ({ database }: Dependencies): ProjectService => {
  return {
    getAll: (): readonly Project[] => {
      const db = database.getDb()
      const stmt = db.prepare('SELECT id, name, path, created_at as createdAt FROM projects ORDER BY id DESC')
      const rows = stmt.all() as { id: number; name: string; path: string; createdAt: string }[]
      return rows
    },

    create: (name: string, path: string): Project => {
      const db = database.getDb()
      const insertStmt = db.prepare('INSERT INTO projects (name, path) VALUES (?, ?)')
      const result = insertStmt.run(name, path)
      const lastInsertRowid = result.lastInsertRowid as number

      const selectStmt = db.prepare('SELECT id, name, path, created_at as createdAt FROM projects WHERE id = ?')
      const project = selectStmt.get(lastInsertRowid) as { id: number; name: string; path: string; createdAt: string }

      return project
    },
  }
}
