import {ipcMain, BrowserWindow, dialog} from 'electron'
import {AppConfig, requestClient, sendEventToAllWindows} from '..'

import {ShelfIpcMainListener} from '../../preload/ipcMainTypes'
import {existsSync} from 'fs'
import {CLIENT_CONFIG_FILE_NAME} from '../ShelfConfig'
import {join} from 'path'
import {OpenDialogReturnValue} from 'electron/main'
import {__DBFILENAME} from '../db/ShelfKyselyDB'

ipcMain.handle('preview_content', createPreviewContentHandler())
ipcMain.handle('getConfig', async () => AppConfig.getAll())
ipcMain.handle('openDialog', openDirDialog)
ipcMain.handle('checkDirectory', async (_, filePath) => {
  return {
    exists: existsSync(filePath),
    isNew: checkDirectory(filePath),
  }
})

ipcMain.handle(
  'toggleFullscreen',
  async (
    evt: Electron.IpcMainInvokeEvent,
    newStatus: boolean,
  ): Promise<void> => {
    const window = BrowserWindow.fromId(evt.sender.id)!
    if (window.fullScreen === newStatus) return
    window.setFullScreen(newStatus ? newStatus : !window.fullScreen)
  },
)

ipcMain.handle('saveClientConfig', async (_, config) => {
  requestClient()!.config.setAll(config)
  return true
})

ipcMain.handle('getClientConfig', async () => {
  return requestClient().config.getAll()
})

ipcMain.handle('saveConfig', async (_, config) => {
  AppConfig.setAll(config)
  sendEventToAllWindows('updateConfig')
  return true
})

ipcMain.handle('openDirectory', async () => {
  const directory = await openDirDialog()

  if (directory.canceled) {
    return {...directory, canceled: true}
  }

  const isNew = checkDirectory(directory.filePaths[0])
  return {...directory, isNew}
})

async function openDirDialog() {
  return dialog.showOpenDialog({
    properties: ['openDirectory'],
  }) as OpenDialogReturnValue
}

function checkDirectory(dir: string) {
  return !(
    existsSync(join(dir, CLIENT_CONFIG_FILE_NAME)) &&
    existsSync(join(dir, __DBFILENAME))
  )
}

function createPreviewContentHandler() {
  const errorSet = new Set<string>()

  const handler: ShelfIpcMainListener<'preview_content'> = async (
    _,
    data,
    type,
  ) => {
    if (errorSet.has(data.hash)) {
      return {instaError: true}
    }

    const client = requestClient()

    switch (type) {
      case 'video':
        client?.ThumbWorker.postMessage({type: 'resize_video', data})
        break
      case 'image':
        client?.ThumbWorker.postMessage({type: 'resize_image', data})
        break
      default:
        return {instaError: true}
    }

    return {instaError: false}
  }

  return handler
}
