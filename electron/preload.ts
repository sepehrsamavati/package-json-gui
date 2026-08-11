import { contextBridge, ipcRenderer } from 'electron'
import { IpcApi } from './types.js'

const api: IpcApi = {
  getOsInfo: () => ipcRenderer.invoke('getOsInfo'),
  getProjects: () => ipcRenderer.invoke('getProjects'),
  createProject: (name: string, path: string) => ipcRenderer.invoke('createProject', name, path),
}

contextBridge.exposeInMainWorld('ipcApi', api)
