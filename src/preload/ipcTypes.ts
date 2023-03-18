/* eslint-disable @typescript-eslint/no-namespace */
import type {IpcMainInvokeEvent, IpcRendererEvent} from 'electron'
import type {OpenDialogReturn} from '../main'
import {Content, Tag} from '../main/src/db/models'

export type TypeLevelRecord<
  TShape extends object,
  TRecord extends {[key: string]: TShape},
> = TRecord

type IpcMainEventShape = {
  args: unknown | unknown[]
  return: unknown
}

export type IpcMainEvents = TypeLevelRecord<
  IpcMainEventShape,
  {
    startTaggerClient: {
      args: [path: string | string[]]
      return: void
    }
    openDialog: {
      args: [options: {dialogType: 'openFile' | 'openDirectory'}]
      return: OpenDialogReturn
    }
    getRecent: {
      args: null
      return: string[]
    }
    getTaggerImages: {
      args: {
        pagination?: {page: number; pageSize: number}
        tags?: Tag[]
      }
      return: {content: Content[]; count: number}
    }
    addTagToContent: {
      args: {contentId: number; tagId: number}
      return: boolean
    }
    getDetailedImage: {
      args: [contentId: number]
      return: Content | null
    }
    getTaggerTags: {
      args: []
      return: Tag[]
    }
  }
>

type IpcRendererEventShape = {
  args: unknown | unknown[]
}

export type IpcRendererEvents = TypeLevelRecord<
  IpcRendererEventShape,
  {
    updateProgress: {
      args: {value: number; key: string}
    }
  }
>

type TaggerIpcMainHandler = <
  TKey extends keyof IpcMainEvents,
  TArgs extends IpcMainEvents[TKey]['args'],
  TReturn extends IpcMainEvents[TKey]['return'],
>(
  channel: TKey,
  handler: (
    event: IpcMainInvokeEvent,
    ...args: TArgs extends Array<any> ? TArgs : [TArgs]
  ) => Promise<TReturn>,
) => void

type TaggerIpcRendererInvoke = <
  TKey extends keyof IpcMainEvents,
  TArgs extends IpcMainEvents[TKey]['args'],
  TReturn extends IpcMainEvents[TKey]['return'],
>(
  evt: TKey,
  ...args: TArgs extends Array<any> ? TArgs : [TArgs]
) => Promise<TReturn>

type TaggerWebContentsSend = <
  TKey extends keyof IpcRendererEvents,
  TArgs extends IpcRendererEvents[TKey]['args'],
>(
  evt: TKey,
  ...args: TArgs extends Array<any> ? TArgs : [TArgs]
) => void | undefined

type TaggerIpcRendererHandler = <
  TKey extends keyof IpcRendererEvents,
  TArgs extends IpcRendererEvents[TKey]['args'],
>(
  evt: TKey,
  handler: (
    evt: IpcRendererEvent,
    ...args: TArgs extends Array<any> ? TArgs : [TArgs]
  ) => void,
) => void

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
