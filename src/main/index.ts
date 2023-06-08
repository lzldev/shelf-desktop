import {
  app,
  shell,
  BrowserWindow,
  ipcMain,
  dialog,
  Tray,
  screen,
  nativeImage,
  Menu,
} from 'electron'
import '../preload/ipcTypes'

import * as fs from 'fs'
import * as path from 'path'
import {electronApp, optimizer, is} from '@electron-toolkit/utils'
import {ShelfClient} from './src/shelf-client/ShelfClient'
import {zJson} from './src/zJson'
import {ShelfWebContentsSend} from '../preload/ipcRendererTypes'
import {SHELF_CONFIG_PATH, SHELF_CONFIG_SCHEMA} from './src/ShelfConfig'

//Imports event Handlers.
import './src/shelf-client'
import {CLIENT_CONFIG_FILE_NAME} from './src/ShelfConfig'
import {OpenDialogReturnValue} from 'electron/main'
import {__DBEXTENSION, __DBFILENAME} from './src/db/ShelfDB'

//TODO: Change name and location
export function requestClient(): ShelfClient | false {
  if (!Client || !Client.ready) {
    //TODO:SEND LOGS
  }
  return Client
}

export const ShelfConfig = new zJson(SHELF_CONFIG_PATH, SHELF_CONFIG_SCHEMA, {
  recentFiles: [],
  defaultColor: '#ef4444',
  ignorePaths: [],
  pageSize: 50,
  layoutMode: 'grid',
})

const WindowOptions: Record<
  string,
  {
    route: string
    startOptions: Electron.BrowserWindowConstructorOptions
  }
> = {
  main: {
    route: 'main',
    startOptions: {
      x: 1024,
      y: 850,
      minWidth: 600,
      minHeight: 400,
    },
  },
  start: {
    route: 'start',
    startOptions: {
      width: 472,
      height: 500,
      minWidth: 472,
      minHeight: 400,
    },
  },
  progress: {
    route: 'progress',
    startOptions: {
      width: 600,
      height: 250,
      resizable: false,
    },
  },
} as const

let Client: ShelfClient

const Windows = new Map<keyof typeof WindowOptions, BrowserWindow>()

function createWindow(route: keyof typeof WindowOptions): void {
  if (Windows.has(route)) return

  const windowOptions = WindowOptions[route]!

  const primaryDisplay = screen.getPrimaryDisplay().bounds
  const positionX = Math.max(
    primaryDisplay.width / 2 +
      (primaryDisplay.x - windowOptions.startOptions.width! / 2),
    0,
  )
  const positionY = Math.max(
    primaryDisplay.height / 2 +
      primaryDisplay.y -
      windowOptions.startOptions.height! / 2,
    0,
  )

  const [currentWindowX, currentWindowY] =
    BrowserWindow.getFocusedWindow()?.getPosition() || [positionX, positionY]

  const newWindow = new BrowserWindow({
    ...WindowOptions[route].startOptions,
    show: false,
    x: currentWindowX,
    y: currentWindowY,
    autoHideMenuBar: true,
    ...(process.platform !== 'darwin'
      ? {
          icon: nativeImage.createFromPath('build/icon.png'),
        }
      : {}),
    webPreferences: {
      webSecurity: false,
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: false,
    },
  })

  newWindow.removeMenu()

  newWindow.on('ready-to-show', () => {
    newWindow.show()
    newWindow.webContents.openDevTools()
  })
  newWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return {action: 'deny'}
  })
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    newWindow.loadURL(
      process.env['ELECTRON_RENDERER_URL'] + `?#/${WindowOptions[route].route}`,
    )
  } else {
    newWindow.loadFile(path.join(__dirname, '../renderer/index.html'), {
      hash: `/${WindowOptions[route].route}`,
    })
  }

  newWindow.on('closed', () => {
    Windows.delete(route)
  })

  Windows.set(route, newWindow)
}

app.whenReady().then(() => {
  app.on('browser-window-created', (_: any, window: BrowserWindow) => {
    optimizer.watchWindowShortcuts(window)
  })

  electronApp.setAppUserModelId('Shelf')

  const appTray = new Tray(nativeImage.createFromPath('build/icon.png'))
  appTray.setTitle('Shelf')

  const menu = Menu.buildFromTemplate([
    {
      label: 'Open',
      click: () => {
        if (Client && !Windows.has('main')) {
          createWindow('main')
        }
      },
    },
    {
      label: 'Exit',
      click: () => {
        app.quit()
      },
    },
  ])

  appTray.setContextMenu(menu)

  createWindow('start')
  app.on('activate', function () {
    if (!BrowserWindow.getAllWindows().length) createWindow('start')
  })
})
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin' && !Client) {
    app.quit()
  }
})

export const sendEventToAllWindows: ShelfWebContentsSend = (evt, ...args) => {
  Windows.forEach((window) => {
    window.webContents.send(evt, ...args)
  })
}
export const updateProgress = (args: {key: string; value: any}) => {
  Windows.get('progress')?.webContents.send('updateProgress', args)
}

const checkDirectory = (dir: string) => {
  return !(
    fs.existsSync(path.join(dir, CLIENT_CONFIG_FILE_NAME)) &&
    fs.existsSync(path.join(dir, __DBFILENAME))
  )
}

const openDirDialog = () =>
  dialog.showOpenDialog({
    properties: ['openDirectory'],
  }) as OpenDialogReturnValue

ipcMain.handle('openDialog', async () => openDirDialog())
ipcMain.handle('openDirectory', async () => {
  const directory = await openDirDialog()

  if (directory.canceled) {
    return {...directory, canceled: true}
  }

  const isNew = checkDirectory(directory.filePaths[0])
  console.log(' ->', isNew)
  return {...directory, isNew}
})

ipcMain.handle('startShelfClient', async (_, options) => {
  const recentFiles = ShelfConfig.get('recentFiles')
  if (recentFiles.findIndex((p) => p == options.basePath)) {
    recentFiles.push(options.basePath)
  }
  if (recentFiles.length >= 8) {
    recentFiles.shift()
  }
  ShelfConfig.set('recentFiles', recentFiles)

  Windows.get('start')?.close()

  if (!Windows.has('progress')) {
    createWindow('progress')
  }

  Client = await ShelfClient.create(options, () => {
    const progressWindow = Windows.get('progress')
    if (progressWindow) {
      progressWindow.close()
    }
    createWindow('main')
  })
})

ipcMain.handle('getConfig', async () => ShelfConfig.getAll())
ipcMain.handle('saveConfig', async (_, config) => {
  ShelfConfig.setAll(config)
  sendEventToAllWindows('updateConfig')
  return true
})

ipcMain.handle('getClientConfig', async () => Client?.config.getAll())
ipcMain.handle('saveClientConfig', async (_, config) => {
  Client.config.setAll(config)
  return true
})
