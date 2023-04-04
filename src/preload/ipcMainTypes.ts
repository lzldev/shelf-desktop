/* eslint-disable @typescript-eslint/no-namespace */
import type {IpcMainInvokeEvent} from 'electron'
import type {OpenDialogReturn} from '../main'
import {Content, Tag} from '../main/src/db/models'
import {TaggerConfigType} from '../main'

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
      args: [rootPath: string]
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
    getConfig: {
      args: never
      return: TaggerConfigType
    }
    saveConfig: {
      args: [config: TaggerConfigType]
      return: boolean
    }
    getTaggerImages: {
      args: {
        pagination?: {offset: number; limit: number}
        order?: [string, 'ASC' | 'DESC']
        tags?: Tag[]
        paths?: {value: string}[]
      }
      return: {content: Content[]; nextCursor?: {offset: number; limit: number}}
    }
    createTag: {
      args: {name: string; parentOnly: boolean}
      return: boolean
    }
    addTagToContent: {
      args: {contentId: number; tagId: number}
      return: boolean
    }
    removeTagfromContent: {
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

export type TaggerIpcMainHandler = <
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

export type TaggerIpcRendererInvoke = <
  TKey extends keyof IpcMainEvents,
  TArgs extends IpcMainEvents[TKey]['args'],
  TReturn extends IpcMainEvents[TKey]['return'],
>(
  evt: TKey,
  ...args: TArgs extends Array<any> ? TArgs : [TArgs]
) => Promise<TReturn>
