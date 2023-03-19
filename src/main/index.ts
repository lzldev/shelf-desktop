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
import {TaggerClient} from './src/tagger-client'
import {zJson, zJsonSchema} from './src/zJson'
import {join} from 'path'
import {z} from 'zod'

const CONFIGPATH = join(app.getPath('userData'), 'config.json')
export const CONFIGSCHEMA = {
  recentFiles: z.array(z.string()),
} as const

const TaggerConfig = new zJson(CONFIGPATH, CONFIGSCHEMA, {
  recentFiles: [],
})

//TODO: Move
const _WindowRoutes = {
  main: {
    route: '',
    startOptions: {
      x: 1024,
      y: 850,
    },
  },
  start: {
    route: 'start',
    startOptions: {
      x: 600,
      y: 800,
    },
  },
  progress: {
    route: 'progress',
    startOptions: {
      x: 600,
      y: 400,
      resizable: false,
    },
  },
} as const

let Client: TaggerClient
const windows = new Map<keyof typeof _WindowRoutes, BrowserWindow>()

function createWindow(route: keyof typeof _WindowRoutes): void {
  if (windows.has(route)) {
    console.log('Window Already Exists.')
    return
  }

  //TODO: Clean this up.
  const screenArea = screen.getPrimaryDisplay().bounds
  const sizeX = _WindowRoutes[route].startOptions?.x || 900
  const sizeY = _WindowRoutes[route].startOptions?.y || 900
  const x = Math.max(screenArea.width / 2 + screenArea.x - sizeX / 2, 0)
  const y = Math.max(screenArea.height / 2 + screenArea.y - sizeY / 2, 0)

  const [currentWindowX, currentWindowY] =
    BrowserWindow.getFocusedWindow()?.getPosition() || [x, y]

  const newWindow = new BrowserWindow({
    ..._WindowRoutes[route].startOptions,
    width: sizeX,
    show: false,
    height: sizeY,
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
    newWindow.loadFile(
      path.join(
        __dirname,
        '../renderer/index.html' + `#/${_WindowRoutes[route].route}`,
      ),
    )
  }

  newWindow.on('closed', () => {
    windows.delete('main')
  })

  windows.set(route, newWindow)
}

app.whenReady().then(() => {
  protocol.registerFileProtocol('tagger', (request: any, callback: any) => {
    const pathname = decodeURI(request.url.replace('tagger://', ''))
    callback(pathname)
  })
  electronApp.setAppUserModelId('electron')
  app.on('browser-window-created', (_: any, window: BrowserWindow) => {
    optimizer.watchWindowShortcuts(window)
  })

  const appTray = new Tray(nativeImage.createFromPath('build/icon.png'))
  appTray.setTitle('Tagger')

  const menu = Menu.buildFromTemplate([
    {
      label: 'Open',
      click: () => {
        if (Client) {
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

export const updateProgress = (args: {key: string; value: any}) => {
  windows.get('progress')?.webContents.send('updateProgress', args)
}

async function startNewClient(path: string) {
  if (!windows.has('progress')) {
    createWindow('progress')
  }

  Client = await TaggerClient.create(path, () => {
    const progWindow = windows.get('progress')
    if (progWindow) {
      progWindow.close()
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
  windows.get('start')?.close()
  const chosenPath = Array.isArray(path) ? path[0] : path

  //TODO: Handle this better
  if (!fs.existsSync(chosenPath)) {
    throw 'Invalid Path'
  }

  const recentFiles = TaggerConfig.get('recentFiles')
  if (recentFiles.length >= 8) {
    recentFiles.shift()
  }
  TaggerConfig.set('recentFiles', recentFiles, true)

  BrowserWindow.fromId(Event.sender.id)?.close()
  startNewClient(chosenPath)
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
  const {content, count} = await Client.getContent(options)
  return {content: JSON.parse(JSON.stringify(content)), count}
})

ipcMain.handle('getDetailedImage', async (_, id) => {
  const res = await Client.getDetailedContent({id: id})
  return JSON.parse(JSON.stringify(res))
})

ipcMain.handle('getConfig', async () => TaggerConfig.getAll())
