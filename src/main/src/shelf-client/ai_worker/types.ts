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

export type AiWorkerReceive =
  | {
      type: 'ready'
      data: void
    }
  | {
      type: 'tagged'
      data: {path: string}
    }

export type AIWORKERTYPE = CustomWorker<AiWorkerInvoke, AiWorkerReceive>
