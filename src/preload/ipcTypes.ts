import {ShelfIpcMainHandler, ShelfIpcRendererInvoke} from './ipcMainTypes'
import {ShelfIpcRendererHandler, ShelfWebContentsSend} from './ipcRendererTypes'

declare module 'electron' {
  export interface BrowserWindow {
    webContents: {
      send: ShelfWebContentsSend
    } & OriginalWebContents
  }
  namespace Electron {
    export type IpcMain = {
      handle: ShelfIpcMainHandler
    } & OriginalIpcMain
    export type IpcRenderer = {
      invoke: ShelfIpcRendererInvoke
      on: ShelfIpcRendererHandler
    } & OriginalIpcRenderer
  }
}

type OriginalIpcMain = Omit<Electron.IpcMain, 'handle'>
type OriginalIpcRenderer = Omit<Electron.IpcRenderer, 'invoke' | 'on'>
type OriginalWebContents = Omit<Electron.WebContents, 'send'>
