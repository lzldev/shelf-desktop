/* eslint-disable @typescript-eslint/no-namespace */
import type {IpcRendererEvent} from 'electron'

export type TypeLevelRecord<
  TShape extends object,
  TRecord extends {[key: string]: TShape},
> = TRecord

type IpcRendererEventShape = {
  args: unknown | unknown[]
}

export type IpcRendererEvents = TypeLevelRecord<
  IpcRendererEventShape,
  {
    updateProgress: {
      args: {value: number; key: string}
    }
    updateConfig: {
      args: []
    }
    updateTags: {
      args: []
    }
  }
>

export type TaggerWebContentsSend = <
  TKey extends keyof IpcRendererEvents,
  TArgs extends IpcRendererEvents[TKey]['args'],
>(
  evt: TKey,
  ...args: TArgs extends Array<any> ? TArgs : [TArgs]
) => void | undefined

export type TaggerIpcRendererHandler = <
  TKey extends keyof IpcRendererEvents,
  TArgs extends IpcRendererEvents[TKey]['args'],
>(
  evt: TKey,
  handler: (
    evt: IpcRendererEvent,
    ...args: TArgs extends Array<any> ? TArgs : [TArgs]
  ) => void,
) => void
