import {contextBridge, ipcRenderer} from 'electron'
import {electronAPI} from '@electron-toolkit/preload'
import './ipcTypes'
import type {ShelfIpcRendererHandler} from './ipcRendererTypes'

const api = {
  invokeOnMain: ipcRenderer.invoke,
  ipcRendererHandle: electronAPI.ipcRenderer.on as ShelfIpcRendererHandler,
}

export type api = typeof api

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
