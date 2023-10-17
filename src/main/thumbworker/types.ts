import {z} from 'zod'
import {CustomWorker} from '../utils/workertypes'

export type ThumbWorkerInvoke = {
  type: 'resize_image'
  data: {filePath: string; hash: string}
}

export type ThumbWorkerReceive = {
  type: 'image_ready'
  data: {path: string}
}

export const ThumbWorkerDataParser = z.object({
  thumbnailPath: z.string({
    description: 'Path to previews folder',
  }),
})

export type ThumbWorkerData = z.infer<typeof ThumbWorkerDataParser>

export type AIWORKERTYPE = CustomWorker<ThumbWorkerInvoke, ThumbWorkerReceive>
