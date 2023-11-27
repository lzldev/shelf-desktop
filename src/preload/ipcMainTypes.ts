import {TypeRecord} from '../types/utils'
import {
  ColorOperation,
  TagOperation,
  batchTagging as BatchTagging,
} from '../types/Operations'

import {
  ShelfClientConfig,
  ShelfConfigType as ShelfConfigType,
} from '../main/ShelfConfig'

import {OpenDialogReturnValue} from 'electron/main'

//TODO: Move this off the Store
import {ContentQuery} from '../renderer/src/hooks/useQueryStore'

import {Pagination} from '../main/db/ShelfControllers'
import {DB, TagColors, Tags} from '../main/db/kysely-types'

import type {DetailedContent, ListContent} from '../main/db/ContentControllers'
import {InsertObject} from 'kysely'

type IpcMainEventShape = {
  args: unknown | unknown[]
  return: unknown
}

export type IpcMainEvents = TypeRecord<
  IpcMainEventShape,
  {
    toggleFullscreen: {
      args: [newvalue: boolean]
      return: void
    }
    startShelfClient: {
      args: [
        options: {
          basePath: string
          config?: Partial<ShelfClientConfig>
        },
      ]
      return: void
    }
    openDialog: {
      args: []
      return: OpenDialogReturnValue
    }
    openDirectory: {
      args: []
      return:
        | {canceled: true}
        | (OpenDialogReturnValue & {canceled: false; isNew: boolean})
    }
    getRecent: {
      args: []
      return: string[]
    }
    getConfig: {
      args: []
      return: ShelfConfigType
    }
    saveConfig: {
      args: [config: ShelfConfigType]
      return: boolean
    }
    getClientConfig: {
      args: []
      return: ShelfClientConfig
    }
    saveClientConfig: {
      args: [config: ShelfClientConfig]
      return: boolean
    }
    getShelfTags: {
      args: []
      return: Tags[]
    }
    editTags: {
      args: [TagOperation[]]
      return: boolean
    }
    batchTagging: {
      args: [BatchTagging]
      return: boolean
    }
    createTag: {
      args: InsertObject<DB, 'Tags'>
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
    getShelfColors: {
      args: []
      return: TagColors[]
    }
    editColors: {
      args: [ColorOperation[]]
      return: boolean
    }
    getShelfContent: {
      args: {
        pagination: Pagination
        order: [string, 'ASC' | 'DESC']
        query: ContentQuery[]
      }
      return: ReturnType<typeof ListContent>
    }
    getDetailedContent: {
      args: [contentId: number]
      return: DetailedContent
    }
    preview_content: {
      args: [
        data: {hash: string; filePath: string},
        preview_type: 'video' | 'image',
      ]
      return: {instaError: boolean}
    }
  }
>

export type ShelfIpcMainHandler = <
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

export type ShelfIpcMainListener<
  TKey extends keyof IpcMainEvents,
  TArgs extends IpcMainEvents[TKey]['args'] = IpcMainEvents[TKey]['args'],
  TReturn extends IpcMainEvents[TKey]['return'] = IpcMainEvents[TKey]['return'],
> = (
  event: Electron.IpcMainInvokeEvent,
  ...args: TArgs extends Array<any> ? TArgs : [TArgs]
) => Promise<TReturn>

export type ShelfIpcRendererInvoke = <
  TKey extends keyof IpcMainEvents,
  TArgs extends IpcMainEvents[TKey]['args'],
  TReturn extends IpcMainEvents[TKey]['return'],
>(
  evt: TKey,
  ...args: TArgs extends Array<any> ? TArgs : [TArgs]
) => Promise<TReturn>
