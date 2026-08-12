import { app, BrowserWindow } from 'electron'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { configureContainer, AppContainer } from './di.js'
import { registerIpcHandlers } from './endpoints/ipc-handlers.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

let win: BrowserWindow | null = null
let container: AppContainer | null = null

const createWindow = (): void => {
  win = new BrowserWindow({
    title: 'package-json-gui',
    width: 1024,
    height: 768,
    webPreferences: {
      preload: join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  const url = process.env.VITE_DEV_SERVER_URL
  if (url) {
    win.loadURL(url)
    win.webContents.openDevTools()
  } else {
    win.loadFile(join(__dirname, '../dist/index.html'))
  }

  win.on('closed', () => {
    win = null
  })
}

app.whenReady().then(() => {
  // Initialize dependency injection container
  container = configureContainer()

  // Register IPC endpoints
  registerIpcHandlers(container)

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (container) {
    const database = container.resolve('database')
    database.close()
  }

  if (process.platform !== 'darwin') {
    app.quit()
  }
})
