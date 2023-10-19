import {z} from 'zod'
import {CustomWorker} from '../../utils/workertypes'
import {MessagePort} from 'node:worker_threads'
type ContentIdWithPath = {id: number; path: string}

export type AiWorkerInvoke =
  | {
      type: 'new_file'
      data: ContentIdWithPath
    }
  | {
      type: 'emit_batch'
      data: void
    }

export type AiWorkerReceive =
  | {
      type: 'ready'
      data: null
    }
  | {
      type: 'tagged_file'
      data: {path: string}
    }
  | {
      type: 'batch_done'
      data: boolean
    }

export const AIWorkerDataParser = z.object({
  dbPath: z.string({
    description: 'Path of SHELFDB',
  }),
})

export type AIWorkerData = z.infer<typeof AIWorkerDataParser>
export type AIWORKERTYPE = CustomWorker<AiWorkerInvoke, AiWorkerReceive>

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
  parentPort.on('message', (v) => {
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
