import {ipcMain, BrowserWindow, dialog} from 'electron'
import {AppConfig, requestClient, sendEventToAllWindows} from '..'

import {SherfIpcMainListener} from '../../preload/ipcMainTypes'
import {existsSync} from 'fs'
import {CLIENT_CONFIG_FILE_NAME} from '../ShelfConfig'
import {__DBFILENAME} from '../db/ShelfDB'
import {join} from 'path'
import {OpenDialogReturnValue} from 'electron/main'

ipcMain.handle('preview_content', createPreviewContentHandler())
function createPreviewContentHandler() {
  const errorSet = new Set<string>()

  const handler: SherfIpcMainListener<'preview_content'> = async (_, data) => {
    const client = requestClient()

    if (errorSet.has(data.hash)) {
      return {instaError: true}
    }

    client?.ThumbWorker.postMessage({type: 'resize_image', data})

    return {instaError: false}
  }

  return handler
}

ipcMain.handle('getConfig', async () => AppConfig.getAll())
ipcMain.handle('saveConfig', async (_, config) => {
  AppConfig.setAll(config)
  sendEventToAllWindows('updateConfig')
  return true
})

ipcMain.handle('getClientConfig', async () => {
  return requestClient()!.config.getAll()
})
ipcMain.handle('saveClientConfig', async (_, config) => {
  requestClient()!.config.setAll(config)
  return true
})

ipcMain.handle('toggleFullscreen', async (evt, newStatus) => {
  const window = BrowserWindow.fromId(evt.sender.id)!
  if (window.fullScreen === newStatus) return
  window.setFullScreen(newStatus ? newStatus : !window.fullScreen)
})

ipcMain.handle('openDialog', async () => openDirDialog())
ipcMain.handle('openDirectory', async () => {
  const directory = await openDirDialog()

  if (directory.canceled) {
    return {...directory, canceled: true}
  }

  const isNew = checkDirectory(directory.filePaths[0])
  return {...directory, isNew}
})

function checkDirectory(dir: string) {
  return !(
    existsSync(join(dir, CLIENT_CONFIG_FILE_NAME)) &&
    existsSync(join(dir, __DBFILENAME))
  )
}

async function openDirDialog() {
  return dialog.showOpenDialog({
    properties: ['openDirectory'],
  }) as OpenDialogReturnValue
}
