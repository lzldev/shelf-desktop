import sharp from 'sharp'

import {
  isMainThread,
  parentPort,
  threadId,
  workerData as _workerData,
} from 'node:worker_threads'

import {createWorkerLogger} from '../../utils/Loggers'
import {ThumbWorkerDataParser, ThumbWorkerInvoke} from './types'
import {handleWorkerMessage} from '../ai_worker/types'
import {join} from 'node:path'

const workerData = ThumbWorkerDataParser.parse(_workerData)

if (isMainThread) {
  throw new Error('Worker called in main thread')
} else if (!parentPort) {
  throw new Error('Worker Parent port missing')
}

const port = parentPort!
const LOGGER = createWorkerLogger(threadId, 'THUMBWORKER', 5)

LOGGER.info('Starting')

async function main() {
  setInterval(() => {
    LOGGER.info('Miau')
  }, 5000)

  handleWorkerMessage<ThumbWorkerInvoke>(port, {
    resize_image: async ({data}) => {
      LOGGER.info(`resizing ${data.filePath}`)

      let image
      try {
        image = sharp(data.filePath, {
          failOn: 'none',
        }).resize({
          width: 300,
          withoutEnlargement: true,
        })
      } catch (e) {
        LOGGER.error(`error on ${data.filePath} ${JSON.stringify(e)}`)
        throw e
      }

      const out_path = join(workerData.thumbnailPath, data.hash + '.jpg')

      LOGGER.info(`writing image to ${out_path}`)

      await image.toFile(out_path).catch((e) => {
        LOGGER.error(`error on ${data.filePath} ${JSON.stringify(e)}`)
      })

      //TODO: Send response to MAIN thread
    },
  })
}

main()
