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

import '../preload/ipcMainTypes'
import * as fs from 'fs'
import * as path from 'path'
import {electronApp, optimizer, is} from '@electron-toolkit/utils'
import {TaggerClient} from './src/tagger-client'
import {zJson, zJsonSchemaInfer} from './src/zJson'
import {join} from 'path'
import {z} from 'zod'
import '../preload/ipcMainTypes'
import {TaggerWebContentsSend} from '../preload/ipcRendererTypes'

const TAGGER_CONFIG_PATH = join(app.getPath('userData'), 'config.json')
export const TAGGER_CONFIG_SCHEMA = {
  recentFiles: z.array(z.string()),
  ignorePaths: z.array(z.string()),
  pageSize: z.number().min(0),
} as const
export type TaggerConfigType = zJsonSchemaInfer<typeof TAGGER_CONFIG_SCHEMA>

const TaggerConfig = new zJson(TAGGER_CONFIG_PATH, TAGGER_CONFIG_SCHEMA, {
  recentFiles: [],
  ignorePaths: [],
  pageSize: 25,
})

//TODO: Find a better name for this.
type _WINDOWROUTESMAPSETTINGSTHINGTYPE = {
  [key: string]: {
    route: string
    startOptions: Electron.BrowserWindowConstructorOptions
  }
}
//TODO: Find a better name for this.
const _WindowRoutes: _WINDOWROUTESMAPSETTINGSTHINGTYPE = {
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
const Windows = new Map<keyof typeof _WindowRoutes, BrowserWindow>()

function createWindow(route: keyof typeof _WindowRoutes): void {
  if (Windows.has(route)) return

  const windowOptions = _WindowRoutes[route]!

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
    ..._WindowRoutes[route].startOptions,
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
      process.env['ELECTRON_RENDERER_URL'] + `#/${_WindowRoutes[route].route}`,
    )
  } else {
    newWindow.loadFile(path.join(__dirname, '../renderer/index.html'), {
      hash: `/${_WindowRoutes[route].route}`,
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
  Windows.forEach((window, key) => {
    window.webContents.send(evt, ...args)
  })
}
//TODO: sendEventToWindow

//TODO: Refactor using sendEventToWindows
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

export type OpenDialogReturn = {
  canceled: boolean
  filePaths: string[]
}

ipcMain.handle('openDialog', async (_, options) => {
  const diagResponse = (await dialog.showOpenDialog({
    properties: [options.dialogType],
    title: 'Select A Tagger Dir or File',
    filters: [
      {
        name: 'TaggerFile',
        extensions: ['tagger'],
      },
    ],
  })) as OpenDialogReturn

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

ipcMain.handle('getTaggerTags', async () => {
  const res = await Client.getTags()
  return JSON.parse(JSON.stringify(res))
})

ipcMain.handle('addTagToContent', async (_, options) => {
  const tag = await Client.addTagToContent(options)
  return !!tag
})

ipcMain.handle('removeTagfromContent', async (_, options) => {
  const tag = await Client.removeTagFromContent(options)
  return !!tag
})

ipcMain.handle('getTaggerImages', async (_, options) => {
  const {content, nextCursor} = await Client.getContent(options)

  return {content: JSON.parse(JSON.stringify(content)), nextCursor}
})

ipcMain.handle('getDetailedImage', async (_, id) => {
  const res = await Client.getDetailedContent({id: id})
  return JSON.parse(JSON.stringify(res))
})

ipcMain.handle('getConfig', async () => TaggerConfig.getAll())
ipcMain.handle('saveConfig', async (_, config) => {
  TaggerConfig.setAll(config)
  sendEventToAllWindows('updateConfig')
  return true
})
