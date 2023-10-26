/* eslint-disable @typescript-eslint/no-namespace */
import type {IpcRendererEvent} from 'electron'
import {TypeRecord} from '../types/utils'

type IpcRendererEventShape = {
  args: unknown | unknown[]
}

export type IpcRendererEvents = TypeRecord<
  IpcRendererEventShape,
  {
    updateProgress: {
      args: {total: number; messages: string[]}
    }
    clientReady: {
      args: []
    }
    updateConfig: {
      args: []
    }
    updateTags: {
      args: []
    }
    updateColors: {
      args: []
    }
    preview_response: {
      args: [
        response: {
          hash: string
          success: boolean
        },
      ]
    }
  }
>

export type ShelfWebContentsSend = <
  TKey extends keyof IpcRendererEvents,
  TArgs extends IpcRendererEvents[TKey]['args'],
>(
  evt: TKey,
  ...args: TArgs extends Array<any> ? TArgs : [TArgs]
) => void | undefined

export type ShelfIpcRendererHandler = <
  TKey extends keyof IpcRendererEvents,
  TArgs extends IpcRendererEvents[TKey]['args'],
>(
  evt: TKey,
  handler: (
    evt: IpcRendererEvent,
    ...args: TArgs extends Array<any> ? TArgs : [TArgs]
  ) => void,
) => void

export type ShelfIpcRendererListener<
  TKey extends keyof IpcRendererEvents,
  TArgs extends IpcRendererEvents[TKey]['args'] = IpcRendererEvents[TKey]['args'],
> = (
  evt: IpcRendererEvent,
  ...args: TArgs extends Array<any> ? TArgs : [TArgs]
) => void
