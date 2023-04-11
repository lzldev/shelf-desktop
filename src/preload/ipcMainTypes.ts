/* eslint-disable @typescript-eslint/no-namespace */
import type {OpenDialogReturn} from '../main'
import {Content, Tag, TagColor} from '../main/src/db/models'
import {TaggerConfigType} from '../main'
import {TagFields} from '../main/src/db/models/Tag'
import {TagColorFields} from '../main/src/db/models/TagColor'
import {Prettify, SomeRequired, TypeLevelRecord} from '../types/utils'
import {ColorOperation} from '../types/Operations'

type IpcMainEventShape = {
  args: unknown | unknown[]
  return: unknown
}

export type IpcMainEvents = TypeLevelRecord<
  IpcMainEventShape,
  {
    toggleFullscreen: {
      args: [newvalue: boolean]
      return: void
    }
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
      args: Prettify<
        | SomeRequired<TagFields, 'colorId'>
        | (Omit<TagFields, 'colorId'> & {
            newColor: Pick<TagColorFields, 'color' | 'name'>
          })
      >
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
    getTaggerColors: {
      args: []
      return: TagColor[]
    }
    editColors: {
      args: [ColorOperation[]]
      return: boolean
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
    event: Electron.IpcMainInvokeEvent,
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
