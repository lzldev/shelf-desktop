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
} from 'electron'

import '../preload/ipcTypes'
import * as fs from 'fs'
import * as path from 'path'
import {electronApp, optimizer, is} from '@electron-toolkit/utils'
import {TaggerClient} from './src/tagger-client'

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

export type HasKey<T, K, TTrue, TFalse = never> = K extends keyof T
  ? TTrue
  : TFalse

let CurrentTaggerClient: TaggerClient //TODO:RENAME

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
    // newWindow.webContents.openDevTools()
  })

  newWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return {action: 'deny'}
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
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

  windows.set(route, newWindow)
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  protocol.registerFileProtocol('tagger', (request: any, callback: any) => {
    const pathname = decodeURI(request.url.replace('tagger://', ''))
    callback(pathname)
  })
  // Set app user model id for windows
  electronApp.setAppUserModelId('electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_: any, window: BrowserWindow) => {
    optimizer.watchWindowShortcuts(window)
  })

  const appTray = new Tray(nativeImage.createFromPath('build/icon.png'))

  appTray.setTitle('Tagger')

  createWindow('start')

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow('start')
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

export const updateProgress = (args: {key: string; value: any}) => {
  windows.get('progress')?.webContents.send('updateProgress', args)
}

async function startNewClient(path: string | string[]) {
  if (!windows.has('progress')) {
    createWindow('progress')
  }

  CurrentTaggerClient = await TaggerClient.create(path, () => {
    const progWindow = windows.get('progress')
    if (progWindow) {
      progWindow.close()
    }
    createWindow('main')
  })

  // console.log(
  //   'Pre Window ID ->',
  //   Windows.progress ? Windows.progress[0].webContents.id : undefined,
  // )
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

  if (!fs.existsSync(chosenPath)) {
    //REMOVEME:Handle this error better.
    throw 'Invalid Path'
  }

  const recentFiles = loadRecent()
  if (recentFiles.length >= 8) {
    recentFiles.shift()
  }
  saveRecent(recentFiles.concat(path))

  BrowserWindow.fromId(Event.sender.id)?.close()
  startNewClient(chosenPath)
  return
})

ipcMain.handle('getTaggerTags', async () => {
  const res = await CurrentTaggerClient.getTags()
  return JSON.parse(JSON.stringify(res))
})

ipcMain.handle('addTagToContent', async (_, options) => {
  const tag = await CurrentTaggerClient.addTagToContent(options)

  return !!tag
})

ipcMain.handle('getTaggerImages', async (_, options) => {
  const {content, count} = await CurrentTaggerClient.getContent(options)

  return {content: JSON.parse(JSON.stringify(content)), count}
})

ipcMain.handle('getDetailedImage', async (_, id) => {
  const res = await CurrentTaggerClient.getOneContent({id: id})
  return JSON.parse(JSON.stringify(res))
})
/*
    TODO:Add Runtime Validation with ZOD since this is being held in a file.
    zJson.parse(path,schema)
*/
ipcMain.handle('getRecent', async () => loadRecent())

const recentPathsFile = path.join(app.getPath('userData'), '/.recentFiles')
const saveRecent = (arr: string[]) => {
  fs.writeFileSync(recentPathsFile, JSON.stringify(arr))
}
const loadRecent = (): string[] => {
  if (fs.existsSync(recentPathsFile)) {
    return JSON.parse(fs.readFileSync(recentPathsFile).toString())
  } else {
    return []
  }
}
