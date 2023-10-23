import {
  app,
  shell,
  BrowserWindow,
  ipcMain,
  Tray,
  screen,
  nativeImage,
  Menu,
} from 'electron'
import '../preload/ipcTypes'

import sharp from 'sharp'

import {electronApp, optimizer, is} from '@electron-toolkit/utils'
import {ShelfClient} from './shelf-client/ShelfClient'
import {zJson} from './zJson'
import {
  IpcRendererEvents,
  ShelfWebContentsSend,
} from '../preload/ipcRendererTypes'

import {
  SHELF_CONFIG_PATH,
  SHELF_CONFIG_SCHEMA,
  SHELF_THUMB_DEFFAULT_PATH,
} from './ShelfConfig'

import './shelf-client'

import {SHELF_LOGGER} from './utils/Loggers'
import {setupWorkerHandlers} from './shelf-client/WorkerEvents'
import {join} from 'path'
import {ShelfWindowID, WindowOptions} from './windows'
import {noUIMode} from './noui'

export const AppConfig = new zJson(SHELF_CONFIG_PATH, SHELF_CONFIG_SCHEMA, {
  recentFiles: [],
  defaultColor: '#fcb5c6',
  ignorePaths: [],
  pageSize: 50,
  layoutMode: 'grid',
  thumbnailPath: SHELF_THUMB_DEFFAULT_PATH,
})

let Client: ShelfClient
const Windows = new Map<ShelfWindowID, BrowserWindow>()

SHELF_LOGGER.info('Starting LOGGER')

export function requestClient(): ShelfClient | null {
  if (!Client || !Client.ready) {
    SHELF_LOGGER.error('Trying to Request a Client but client is not ready.')
    return null
  }
  return Client
}

function createWindow(windowId: ShelfWindowID): void {
  if (Windows.has(windowId)) return

  const windowOptions = WindowOptions[windowId]
  const primaryDisplay = screen.getPrimaryDisplay().bounds

  const positionX = Math.max(
    primaryDisplay.width / 2 +
      (primaryDisplay.x - windowOptions.startOptions.width / 2),
    0,
  )
  const positionY = Math.max(
    primaryDisplay.height / 2 +
      primaryDisplay.y -
      windowOptions.startOptions.height / 2,
    0,
  )

  const [currentWindowX, currentWindowY] =
    BrowserWindow.getFocusedWindow()?.getPosition() || [positionX, positionY]

  const newWindow = new BrowserWindow({
    ...WindowOptions[windowId].startOptions,
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
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
    },
  })

  newWindow.on('ready-to-show', () => {
    newWindow.show()
  })

  newWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return {action: 'deny'}
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    newWindow.loadURL(
      process.env['ELECTRON_RENDERER_URL'] +
        `?#/${WindowOptions[windowId].route}`,
    )
  } else {
    newWindow.loadFile(join(__dirname, '../renderer/index.html'), {
      hash: `/${WindowOptions[windowId].route}`,
    })
  }

  newWindow.on('closed', () => {
    Windows.delete(windowId)
  })

  Windows.set(windowId, newWindow)
}

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

app.whenReady().then(async () => {
  if (import.meta.env.MAIN_VITE_NO_UI) {
    return await noUIMode()
  }

  app.on('browser-window-created', (_: any, window: BrowserWindow) => {
    optimizer.watchWindowShortcuts(window)
  })

  electronApp.setAppUserModelId('Shelf')

  const appTray = new Tray(nativeImage.createFromPath('build/icon.png'))
  appTray.setContextMenu(
    Menu.buildFromTemplate([
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
    ]),
  )

  createWindow('start')
  app.on('activate', function () {
    if (!BrowserWindow.getAllWindows().length) createWindow('start')
  })
})

ipcMain.handle('startShelfClient', async (_, options) => {
  const recentFiles = AppConfig.get('recentFiles')

  if (recentFiles.findIndex((p) => p == options.basePath)) {
    recentFiles.push(options.basePath)
  }

  if (recentFiles.length >= 8) {
    recentFiles.shift()
  }

  AppConfig.set('recentFiles', recentFiles)
  Windows.get('start')?.close()

  if (!Windows.has('progress')) {
    createWindow('progress')
  }

  Client = await ShelfClient.create(options, () => {
    const progressWindow = Windows.get('progress')
    if (progressWindow) {
      progressWindow.close()
    }

    setupWorkerHandlers()

    createWindow('main')
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin' && !Client) {
    app.quit()
  }
})

process.on('SIGINT', () => {
  app.exit()
})
