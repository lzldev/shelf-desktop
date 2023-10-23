import {z} from 'zod'
import {CustomWorker} from '../../../types/Workers'

export type ThumbWorkerInvoke = {
  type: 'resize_image'
  data: {filePath: string; hash: string}
}

export type ThumbWorkerReceive =
  | {
      type: 'image_ready'
      data: {hash: string}
    }
  | {
      type: 'image_error'
      data: {hash: string}
    }

export const ThumbWorkerDataParser = z.object({
  max_threads: z.number(),
  thumbnailPath: z.string({
    description: 'Path to previews folder',
  }),
})

export type ThumbWorkerType = CustomWorker<
  ThumbWorkerInvoke,
  ThumbWorkerReceive
>
export type ThumbWorkerData = z.infer<typeof ThumbWorkerDataParser>
