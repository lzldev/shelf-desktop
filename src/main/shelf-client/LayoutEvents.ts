import {ipcMain, BrowserWindow} from 'electron'

ipcMain.handle('toggleFullscreen', async (evt, newStatus) => {
  const window = BrowserWindow.fromId(evt.sender.id)!

  if (window.fullScreen === newStatus) return
  window.setFullScreen(newStatus ? newStatus : !window.fullScreen)
})
