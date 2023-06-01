import {Content, Tag, TagColor} from '../main/src/db/models'
import {TagFields} from '../main/src/db/models/Tag'
import {TagColorFields} from '../main/src/db/models/TagColor'
import {Prettify, SomeRequired, TypeLevelRecord} from '../types/utils'
import {
  ColorOperation,
  TagOperation,
  batchTagging as BatchTagging,
} from '../types/Operations'
import {
  ShelfClientConfig,
  ShelfConfigType as ShelfConfigType,
} from '../main/src/ShelfConfig'

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
    startShelfClient: {
      args: [rootPath: string]
      return: void
    }
    openDialog: {
      args: [options: {dialogType: 'openFile' | 'openDirectory'}]
      return: any //TODO: Agora
    }
    getRecent: {
      args: null
      return: string[]
    }
    getConfig: {
      args: never
      return: ShelfConfigType
    }
    saveConfig: {
      args: [config: ShelfConfigType]
      return: boolean
    }
    getClientConfig: {
      args: never
      return: ShelfClientConfig
    }
    saveClientConfig: {
      args: [config: ShelfClientConfig]
      return: boolean
    }
    getShelfImages: {
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
    getShelfTags: {
      args: []
      return: Tag[]
    }
    getShelfColors: {
      args: []
      return: TagColor[]
    }
    editColors: {
      args: [ColorOperation[]]
      return: boolean
    }
    editTags: {
      args: [TagOperation[]]
      return: boolean
    }
    batchTagging: {
      args: [BatchTagging]
      return: boolean
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

export type ShelfIpcRendererInvoke = <
  TKey extends keyof IpcMainEvents,
  TArgs extends IpcMainEvents[TKey]['args'],
  TReturn extends IpcMainEvents[TKey]['return'],
>(
  evt: TKey,
  ...args: TArgs extends Array<any> ? TArgs : [TArgs]
) => Promise<TReturn>
