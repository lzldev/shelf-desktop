import {Contents, Paths} from '../../db/kysely-types'
import {CustomWorker} from '../../utils/workertypes'

type ContentIdWithPath = NonNullable<Pick<Contents, 'id'> & Pick<Paths, 'path'>>

export type AiWorkerInvoke =
  | {
      type: 'new_file'
      data: ContentIdWithPath
    }
  | {
      type: 'start'
      data: {files: string[]}
    }
  | {
      type: 'emit_batch'
      data: void
    }

export type AiWorkerReceive =
  | {
      type: 'ready'
      data: void
    }
  | {
      type: 'tagged_file'
      data: {path: string}
    }
  | {
      type: 'batch_done'
      data: boolean
    }

export type AIWORKERTYPE = CustomWorker<AiWorkerInvoke, AiWorkerReceive>
