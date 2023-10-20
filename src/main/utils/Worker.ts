import {MessagePort} from 'node:worker_threads'

type BaseDisc = {type: string}

type MapHandlers<TWorkerMessage extends BaseDisc> = {
  [key in TWorkerMessage['type']]?: (
    value: Extract<TWorkerMessage, {type: key}>,
  ) => void
}

export type WorkerHandler<T extends {type: string}> = Parameters<
  typeof handleWorkerMessage<T>
>[1]

export const handleWorkerMessage = <
  TWorkerMessage extends BaseDisc,
  THandlers extends MapHandlers<TWorkerMessage> = MapHandlers<TWorkerMessage>,
>(
  parentPort: MessagePort,
  handlers: THandlers,
) => {
  parentPort.on('message', (v: unknown) => {
    const msg = v as unknown
    if (!(msg && typeof msg === 'object' && 'type' in msg)) {
      throw 'Invalid Message'
    }

    const handler = handlers[msg.type as TWorkerMessage['type']]

    if (!handler) {
      return
    }

    handler(msg as Parameters<typeof handler>[0])
  })
}
