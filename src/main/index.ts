import {
  app,
  shell,
  BrowserWindow,
  ipcMain,
  dialog,
  protocol,
  Tray,
  screen,
  nativeImage,
  Menu,
} from 'electron'
import '../preload/ipcTypes'

import * as fs from 'fs'
import * as path from 'path'
import {electronApp, optimizer, is} from '@electron-toolkit/utils'
import {TaggerClient} from './src/tagger-client/TaggerClient'
import {zJson} from './src/zJson'
import {TaggerWebContentsSend} from '../preload/ipcRendererTypes'
import {TAGGER_CONFIG_PATH, TAGGER_CONFIG_SCHEMA} from './src/TaggerConfig'

//Imports event Handlers.
import './src/tagger-client/' //FIXME: This import is doing too much work

//TODO: Change name and location
export function requestClient(): TaggerClient | false {
  if (!Client || !Client.ready) {
    //TODO:SEND LOGS
  }

  return Client
}

const TaggerConfig = new zJson(TAGGER_CONFIG_PATH, TAGGER_CONFIG_SCHEMA, {
  recentFiles: [],
  defaultColor: '#ef4444',
  ignorePaths: [],
  pageSize: 25,
})

type WindowOptionsRecord = {
  [key: string]: {
    route: string
    startOptions: Electron.BrowserWindowConstructorOptions
  }
}

const WindowOptions: WindowOptionsRecord = {
  main: {
    route: '',
    startOptions: {
      x: 1024,
      y: 850,
    },
  },
  options: {
    route: 'options',
    startOptions: {
      height: 600,
      width: 800,
    },
  },
  start: {
    route: 'start',
    startOptions: {
      width: 600,
      height: 800,
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

let Client: TaggerClient

const Windows = new Map<keyof typeof WindowOptions, BrowserWindow>()

function createWindow(route: keyof typeof WindowOptions): void {
  if (Windows.has(route)) return

  const windowOptions = WindowOptions[route]!

  const screenArea = screen.getPrimaryDisplay().bounds
  const positionX = Math.max(
    screenArea.width / 2 + screenArea.x - windowOptions.startOptions.width! / 2,
    0,
  )
  const positionY = Math.max(
    screenArea.height / 2 +
      screenArea.y -
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
  protocol.registerFileProtocol('tagger', (request: any, callback: any) => {
    const pathname = decodeURI(request.url.replace('tagger://', ''))
    callback(pathname)
  })
  electronApp.setAppUserModelId('Tagger')
  app.on('browser-window-created', (_: any, window: BrowserWindow) => {
    optimizer.watchWindowShortcuts(window)
  })

  const appTray = new Tray(nativeImage.createFromPath('build/icon.png'))
  appTray.setTitle('Tagger')

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
      label: 'Options',
      click: () => {
        if (Client && !Windows.has('options')) {
          createWindow('options')
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

export const sendEventToAllWindows: TaggerWebContentsSend = (evt, ...args) => {
  Windows.forEach((window) => {
    window.webContents.send(evt, ...args)
  })
}
export const updateProgress = (args: {key: string; value: any}) => {
  Windows.get('progress')?.webContents.send('updateProgress', args)
}
async function startNewClient(path: string) {
  if (!Windows.has('progress')) {
    createWindow('progress')
  }

  Client = await TaggerClient.create(path, () => {
    const progressWindow = Windows.get('progress')
    if (progressWindow) {
      progressWindow.close()
    }
    createWindow('main')
  })
}

ipcMain.handle('openDialog', async (_, options) => {
  const diagResponse = await dialog.showOpenDialog({
    properties: [options.dialogType],
    title: 'Select A Tagger Dir or File',
    filters: [
      {
        name: 'TaggerFile',
        extensions: ['tagger'],
      },
    ],
  })

  return diagResponse
})
ipcMain.handle('startTaggerClient', async (Event, path) => {
  const recentFiles = TaggerConfig.get('recentFiles')
  if (!fs.existsSync(path)) {
    const idx = recentFiles.findIndex((p) => p == path)
    if (idx !== -1) {
      recentFiles.splice(idx, 1)
      TaggerConfig.set('recentFiles', recentFiles)
    }

    return
  }

  Windows.get('start')?.close()

  recentFiles.push(path)
  if (recentFiles.length >= 8) {
    recentFiles.shift()
  }

  TaggerConfig.set('recentFiles', recentFiles)

  BrowserWindow.fromId(Event.sender.id)?.close()
  startNewClient(path)
  return
})
ipcMain.handle('toggleFullscreen', async (evt, newStatus) => {
  const window = BrowserWindow.fromId(evt.sender.id)!

  if (window.fullScreen === newStatus) return
  window.setFullScreen(newStatus ? newStatus : !window.fullScreen)
})
ipcMain.handle('getConfig', async () => TaggerConfig.getAll())
ipcMain.handle('saveConfig', async (_, config) => {
  TaggerConfig.setAll(config)
  sendEventToAllWindows('updateConfig')
  return true
})
