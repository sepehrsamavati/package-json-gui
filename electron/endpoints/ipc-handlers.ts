import { ipcMain } from 'electron'
import { AppContainer } from '../di.js'

export const registerIpcHandlers = (container: AppContainer): void => {
  const osService = container.resolve('osService')
  const projectService = container.resolve('projectService')
  const dependencyService = container.resolve('dependencyService')

  ipcMain.handle('getOsInfo', async () => {
    return osService.getOsInfo()
  })

  ipcMain.handle('getProjects', async () => {
    return projectService.getAll()
  })

  ipcMain.handle('createProject', async (_event, name: string, path: string, type?: string, structure?: string) => {
    return projectService.create(name, path, type, structure)
  })

  ipcMain.handle('updateProject', async (_event, id: number, type: string, structure: string) => {
    return projectService.update(id, type, structure)
  })

  ipcMain.handle('detectPackages', async (_event, projectPath: string) => {
    return dependencyService.detectPackages(projectPath)
  })

  ipcMain.handle('getDependencies', async (_event, packageJsonPath: string) => {
    return dependencyService.getDependencies(packageJsonPath)
  })
}
