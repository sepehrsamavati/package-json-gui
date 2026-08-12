import { createContainer, asFunction, AwilixContainer } from 'awilix'
import { createDatabase, DatabaseInstance } from './infra/database.js'
import { createProjectService, ProjectService } from './apps/project-service.js'
import { createOsService, OsService } from './apps/os-service.js'

export type ContainerDependencies = {
  database: DatabaseInstance
  projectService: ProjectService
  osService: OsService
}

export type AppContainer = AwilixContainer<ContainerDependencies>

export const configureContainer = (): AppContainer => {
  const container = createContainer<ContainerDependencies>()

  container.register({
    database: asFunction(createDatabase).singleton(),
    projectService: asFunction(createProjectService).singleton(),
    osService: asFunction(createOsService).singleton(),
  })

  return container
}
