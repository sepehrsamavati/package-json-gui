import { DetectedPackage, DetectionResult, DependencyItem, DependencyListResult } from './apps/dependency-service.js'

export type { DetectedPackage, DetectionResult, DependencyItem, DependencyListResult }

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
  detectPackages: (projectPath: string) => Promise<DetectionResult>
  getDependencies: (packageJsonPath: string) => Promise<DependencyListResult>
}

// Extend global Window interface securely
declare global {
  interface Window {
    ipcApi: IpcApi
  }
}
