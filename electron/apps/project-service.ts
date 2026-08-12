import { DatabaseInstance } from '../infra/database.js'
import { Project } from '../types.js'

export type ProjectService = {
  getAll: () => readonly Project[]
  create: (name: string, path: string, type?: string, structure?: string) => Project
  update: (id: number, type: string, structure: string) => Project
}

type Dependencies = {
  database: DatabaseInstance
}

export const createProjectService = ({ database }: Dependencies): ProjectService => {
  return {
    getAll: (): readonly Project[] => {
      const db = database.getDb()
      const stmt = db.prepare('SELECT id, name, path, type, structure, created_at as createdAt FROM projects ORDER BY id DESC')
      const rows = stmt.all() as { id: number; name: string; path: string; type: string; structure: string; createdAt: string }[]
      return rows
    },

    create: (name: string, path: string, type = 'Web client', structure = 'Single Repo'): Project => {
      const db = database.getDb()
      const insertStmt = db.prepare('INSERT INTO projects (name, path, type, structure) VALUES (?, ?, ?, ?)')
      const result = insertStmt.run(name, path, type, structure)
      const lastInsertRowid = result.lastInsertRowid as number

      const selectStmt = db.prepare('SELECT id, name, path, type, structure, created_at as createdAt FROM projects WHERE id = ?')
      const project = selectStmt.get(lastInsertRowid) as { id: number; name: string; path: string; type: string; structure: string; createdAt: string }

      return project
    },

    update: (id: number, type: string, structure: string): Project => {
      const db = database.getDb()
      const updateStmt = db.prepare('UPDATE projects SET type = ?, structure = ? WHERE id = ?')
      updateStmt.run(type, structure, id)

      const selectStmt = db.prepare('SELECT id, name, path, type, structure, created_at as createdAt FROM projects WHERE id = ?')
      const project = selectStmt.get(id) as { id: number; name: string; path: string; type: string; structure: string; createdAt: string }

      return project
    },
  }
}
