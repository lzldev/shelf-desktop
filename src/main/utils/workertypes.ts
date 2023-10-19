import { TransferListItem, Worker } from 'node:worker_threads'

type keptEvents = {
  addListener(event: 'error', listener: (err: Error) => void): Worker
  addListener(event: 'exit', listener: (exitCode: number) => void): Worker
  addListener(event: 'messageerror', listener: (error: Error) => void): Worker
  addListener(event: 'online', listener: () => void): Worker
  emit(event: 'error', err: Error): boolean
  emit(event: 'exit', exitCode: number): boolean
  emit(event: 'messageerror', error: Error): boolean
  emit(event: 'online'): boolean
  on(event: 'error', listener: (err: Error) => void): Worker
  on(event: 'exit', listener: (exitCode: number) => void): Worker
  on(event: 'messageerror', listener: (error: Error) => void): Worker
  on(event: 'online', listener: () => void): Worker
  once(event: 'error', listener: (err: Error) => void): Worker
  once(event: 'exit', listener: (exitCode: number) => void): Worker
  once(event: 'messageerror', listener: (error: Error) => void): Worker
  once(event: 'online', listener: () => void): Worker
  prependListener(event: 'error', listener: (err: Error) => void): Worker
  prependListener(event: 'exit', listener: (exitCode: number) => void): Worker
  prependListener(
    event: 'messageerror',
    listener: (error: Error) => void,
  ): Worker
  prependListener(event: 'online', listener: () => void): Worker
  prependOnceListener(event: 'error', listener: (err: Error) => void): Worker
  prependOnceListener(
    event: 'exit',
    listener: (exitCode: number) => void,
  ): Worker
  prependOnceListener(
    event: 'messageerror',
    listener: (error: Error) => void,
  ): Worker
  prependOnceListener(event: 'online', listener: () => void): Worker
  removeListener(event: 'error', listener: (err: Error) => void): Worker
  removeListener(event: 'exit', listener: (exitCode: number) => void): Worker
  removeListener(
    event: 'messageerror',
    listener: (error: Error) => void,
  ): Worker
  removeListener(event: 'online', listener: () => void): Worker
  off(event: 'error', listener: (err: Error) => void): Worker
  off(event: 'exit', listener: (exitCode: number) => void): Worker
  off(event: 'messageerror', listener: (error: Error) => void): Worker
  off(event: 'online', listener: () => void): Worker
}

/*
    Worker with events removed
*/
type Stripped_Worker = Omit<
  Worker,
  | 'postMessage'
  | 'addListener'
  | 'emit'
  | 'on'
  | 'once'
  | 'prependListener'
  | 'prependOnceListener'
  | 'removeListener'
  | 'off'
>

export type CustomWorker<TInvoke, TReceive> = Stripped_Worker &
  keptEvents & {
    postMessage(
      value: TInvoke,
      transferList?: ReadonlyArray<TransferListItem>,
    ): void
    addListener(event: 'message', listener: (value: TReceive) => void): any
    emit(event: 'message', value: TReceive): boolean
    on(event: 'message', listener: (value: TReceive) => void): Worker
    once(event: 'message', listener: (value: TReceive) => void): Worker
    prependListener(
      event: 'message',
      listener: (value: TReceive) => void,
    ): Worker
    prependOnceListener(
      event: 'message',
      listener: (value: TReceive) => void,
    ): Worker
    removeListener(
      event: 'message',
      listener: (value: TReceive) => void,
    ): Worker
    off(event: 'message', listener: (value: TReceive) => void): Worker
  }
