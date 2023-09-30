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
import * as readline from 'readline'

import * as fs from 'fs'
import * as path from 'path'
import {electronApp, optimizer, is} from '@electron-toolkit/utils'
import {ShelfClient} from './shelf-client/ShelfClient'
import {zJson} from './zJson'
import {
  IpcRendererEvents,
  ShelfWebContentsSend,
} from '../preload/ipcRendererTypes'
import {SHELF_CONFIG_PATH, SHELF_CONFIG_SCHEMA} from './ShelfConfig'

//Imports event Handlers.
import './shelf-client'

import {CLIENT_CONFIG_FILE_NAME} from './ShelfConfig'
import {OpenDialogReturnValue} from 'electron/main'
import {__DBFILENAME} from './db/ShelfDB'
import {Content, Path, Tag} from './db/models'
import {SHELF_LOGGER} from './utils/Loggers'

app.commandLine.appendSwitch('--trace-warnings')

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

//TODO: Move files
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

SHELF_LOGGER.info('Starting LOGGER')

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

app.whenReady().then(async () => {
  if (import.meta.env.MAIN_VITE_NO_UI) {
    if (!import.meta.env.MAIN_VITE_NO_UI_PATH) {
      throw 'INVALID PATH FOR [NO_UI] MODE'
    }

    SHELF_LOGGER.info('STARTING IN NO_UI MODE')

    Client = await ShelfClient.create(
      {
        basePath: import.meta.env.MAIN_VITE_NO_UI_PATH,
        config: {
          ignoredPaths: ['./examples/ignored/*'],
        },
      },
      () => {},
    )

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    rl.on('SIGINT', () => {
      app.exit()
    })

    rl.on('line', async (str) => {
      switch (str) {
        case 'l':
          console.log(Client.getWatchedFiles())
          break
        case 'c': {
          const content = await Content.findAll({
            include: [{model: Tag}, {model: Path}],
          })

          SHELF_LOGGER.info(content)
          break
        }
        default: {
          break
        }
      }
    })

    return
  }

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
export const updateProgress = (
  args: IpcRendererEvents['updateProgress']['args'],
) => {
  Windows.get('progress')?.webContents.send('updateProgress', args)
}

const checkDirectory = (dir: string) => {
  return !(
    fs.existsSync(path.join(dir, CLIENT_CONFIG_FILE_NAME)) &&
    fs.existsSync(path.join(dir, __DBFILENAME))
  )
}

const openDirDialog = async () =>
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

process.on('SIGINT', () => {
  app.exit()
})
