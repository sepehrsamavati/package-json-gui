import { ipcMain } from 'electron'
import { AppContainer } from '../di.js'

export const registerIpcHandlers = (container: AppContainer): void => {
  const osService = container.resolve('osService')
  const projectService = container.resolve('projectService')

  ipcMain.handle('getOsInfo', async () => {
    return osService.getOsInfo()
  })

  ipcMain.handle('getProjects', async () => {
    return projectService.getAll()
  })

  ipcMain.handle('createProject', async (_event, name: string, path: string) => {
    return projectService.create(name, path)
  })
}
