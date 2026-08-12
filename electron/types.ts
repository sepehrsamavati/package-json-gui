export type Project = {
  id: number
  name: string
  path: string
  type: string
  structure: string
  createdAt: string
}

export type OsInfo = {
  platform: string
  release: string
  arch: string
  uptime: number
}

export type IpcApi = {
  getOsInfo: () => Promise<OsInfo>
  getProjects: () => Promise<readonly Project[]>
  createProject: (name: string, path: string, type?: string, structure?: string) => Promise<Project>
  updateProject: (id: number, type: string, structure: string) => Promise<Project>
}

// Extend global Window interface securely
declare global {
  interface Window {
    ipcApi: IpcApi
  }
}
