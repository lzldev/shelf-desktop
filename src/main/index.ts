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
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { TaggerClient } from './src/tagger-client'

//TODO: Move
const WindowRoutes = {
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

const Windows = new Map<keyof typeof WindowRoutes, BrowserWindow>()
const TaggerClients: TaggerClient[] = []

function createWindow<Route extends keyof typeof WindowRoutes>(
    route: Route,
): void {
    if (Windows.has(route)) {
        console.log('Window Already Exists.')
        return
    }

    //FIXTHIS: Clean this up.
    const screenArea = screen.getPrimaryDisplay().bounds
    const sizeX = WindowRoutes[route].startOptions?.x || 900
    const sizeY = WindowRoutes[route].startOptions?.y || 900
    const x = Math.max(screenArea.width / 2 + screenArea.x - sizeX / 2, 0)
    const y = Math.max(screenArea.height / 2 + screenArea.y - sizeY / 2, 0)

    const [currentWindowX, currentWindowY] =
        BrowserWindow.getFocusedWindow()?.getPosition() || [x, y]

    const newWindow = new BrowserWindow({
        ...WindowRoutes[route].startOptions,
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
        return { action: 'deny' }
    })

    // HMR for renderer base on electron-vite cli.
    // Load the remote URL for development or the local html file for production.
    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        newWindow.loadURL(
            process.env['ELECTRON_RENDERER_URL'] +
                `#/${WindowRoutes[route].route}`,
        )
    } else {
        newWindow.loadFile(
            path.join(
                __dirname,
                '../renderer/index.html' + `#/${WindowRoutes[route].route}`,
            ),
        )
    }

    Windows.set(route, newWindow)
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
    protocol.registerFileProtocol('tagger', (request, callback) => {
        const url = request.url.substring(9)
        callback({ path: url })
    })
    // Set app user model id for windows
    electronApp.setAppUserModelId('electron')

    // Default open or close DevTools by F12 in development
    // and ignore CommandOrControl + R in production.
    // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
    app.on('browser-window-created', (_, window) => {
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

export const updateProgress = (args: { key: string; value: any }) => {
    Windows.get('progress')?.webContents.send('updateProgress', args)
}

async function startNewClient(path: string | string[]) {
    if (TaggerClients.length > 0) {
        console.log('Multiple Clients .... To be implemented')
        return
    }
    if (!Windows.get('progress')) {
        createWindow('progress')
    }
    TaggerClients.push(
        await TaggerClient.create(path, () => {
            const progWindow = Windows.get('progress')

            if (progWindow) {
                console.log('Window Found ->', 'Closing')
                console.log('id ->', progWindow.id)
                progWindow.close()
            }
            createWindow('main')
        }),
    )
    console.log('Pre Window ID ->', Windows.get('progress')?.webContents.id)
}

/* 
    TODO:implement
        ipcMain.handle('errorPopup',() => {
    }) 
*/

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
    Windows.get('start')?.close()
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
    const r: any = []

    for (let i = 0; i < TaggerClients.length; i++) {
        const res = await TaggerClients[i].getTags()
        if (!res) {
            continue
        }
        r.push(...res)
    }

    return JSON.parse(JSON.stringify(r))
})

ipcMain.handle('getTaggerImages', async (_, options) => {
    const r: any = []

    for (let i = 0; i < TaggerClients.length; i++) {
        const res = await TaggerClients[i].getContent(options)
        if (!res) {
            continue
        }
        r.push(...res)
    }

    return JSON.parse(JSON.stringify(r))
})
/*
    TODO:Add Runtime Validation with ZOD since its being held in a file.
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
