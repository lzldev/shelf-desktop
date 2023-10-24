import {
  isMainThread,
  parentPort,
  threadId,
  workerData as _workerData,
} from 'node:worker_threads'

import sharp from 'sharp'

import {createWorkerLogger} from '../../utils/Loggers'

import {
  ThumbWorkerDataParser,
  ThumbWorkerInvoke,
  ThumbWorkerReceive,
} from './types'

import {join} from 'node:path'

import {createPortWrapper, handleWorkerMessage} from '../../utils/Worker'

const workerData = ThumbWorkerDataParser.parse(_workerData)

if (isMainThread) {
  throw new Error('Worker called in main thread')
} else if (!parentPort) {
  throw new Error('Worker Parent port missing')
}

const port = parentPort!
const postMessage = createPortWrapper<ThumbWorkerReceive>(port)

const LOGGER = createWorkerLogger(threadId, 'THUMBWORKER', 5)

LOGGER.info('Starting')

async function main() {
  handleWorkerMessage<ThumbWorkerInvoke>(port, {
    resize_image: async ({data}) => {
      LOGGER.info(`resizing ${data.filePath}`)

      const out = await resizeImage(data.filePath, data.hash).catch((e) => {
        LOGGER.error(`error in ${data.filePath} ${JSON.stringify(e)}`)

        postMessage('image_error', {
          type: 'image_error',
          data: {
            hash: data.hash,
          },
        })
      })

      if (!out) {
        return
      }

      postMessage('image_ready', {
        type: 'image_ready',
        data: {
          hash: data.hash,
        },
      })
    },
  })
}

async function resizeImage(filePath: string, hash: string) {
  const image = sharp(filePath, {
    failOn: 'none',
  }).resize({
    width: 300,
    withoutEnlargement: true,
  })

  const out = join(workerData.thumbnailPath, hash + '.jpg')

  LOGGER.info(`writing image to ${out}`)

  return image.toFile(out)
}

main()
