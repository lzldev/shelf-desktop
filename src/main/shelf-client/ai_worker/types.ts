import {z} from 'zod'
import {CustomWorker} from '../../../types/Workers'
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
