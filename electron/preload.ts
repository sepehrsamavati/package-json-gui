import { contextBridge, ipcRenderer } from 'electron'
import { IpcApi } from './types.js'

const api: IpcApi = {
  getOsInfo: () => ipcRenderer.invoke('getOsInfo'),
  getProjects: () => ipcRenderer.invoke('getProjects'),
  createProject: (name: string, path: string, type?: string, structure?: string) =>
    ipcRenderer.invoke('createProject', name, path, type, structure),
  updateProject: (id: number, type: string, structure: string) =>
    ipcRenderer.invoke('updateProject', id, type, structure),
  detectPackages: (projectPath: string) => ipcRenderer.invoke('detectPackages', projectPath),
  getDependencies: (packageJsonPath: string) => ipcRenderer.invoke('getDependencies', packageJsonPath),
}

contextBridge.exposeInMainWorld('ipcApi', api)
