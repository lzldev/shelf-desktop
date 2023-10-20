import { ipcMain, BrowserWindow } from 'electron'
import { requestClient } from '..'

ipcMain.handle('toggleFullscreen', async (evt, newStatus) => {
  const window = BrowserWindow.fromId(evt.sender.id)!

  if (window.fullScreen === newStatus) return
  window.setFullScreen(newStatus ? newStatus : !window.fullScreen)
})

const errorSet = new Set<string>()

ipcMain.handle('preview_content', async (_, data) => {
  const client = requestClient()

  if (errorSet.has(data.hash)) {
    return { instaError: true }
  }

  client?.ThumbWorker.postMessage({ type: 'resize_image', data })

  return { instaError: false }
})
