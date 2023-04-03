/* eslint-disable @typescript-eslint/no-namespace */
import {TaggerIpcMainHandler, TaggerIpcRendererInvoke} from './ipcMainTypes'
import {
  TaggerIpcRendererHandler,
  TaggerWebContentsSend,
} from './ipcRendererTypes'

declare module 'electron' {
  export interface BrowserWindow {
    webContents: {
      send: TaggerWebContentsSend
    } & OriginalWebContents
  }
  namespace Electron {
    export type IpcMain = {
      handle: TaggerIpcMainHandler
    } & OriginalIpcMain
    export type IpcRenderer = {
      invoke: TaggerIpcRendererInvoke
      on: TaggerIpcRendererHandler
    } & OriginalIpcRenderer
  }
}

type OriginalIpcMain = Omit<Electron.IpcMain, 'handle'>
type OriginalIpcRenderer = Omit<Electron.IpcRenderer, 'invoke' | 'on'>
type OriginalWebContents = Omit<Electron.WebContents, 'send'>
