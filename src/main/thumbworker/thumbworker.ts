import {
  isMainThread,
  parentPort as pp,
  threadId,
  workerData as _workerData,
} from 'node:worker_threads'
import {createWorkerLogger} from '../utils/Loggers'
import sharp from 'sharp'

import {ThumbWorkerDataParser} from './types'

const workerData = ThumbWorkerDataParser.parse(_workerData)

if (isMainThread) {
  throw new Error('Worker called in main thread')
} else if (!pp) {
  throw new Error('Worker Parent port missing')
}

const LOGGER = createWorkerLogger(threadId, 'THUMBWORKER', 5)

LOGGER.info('Starting')

async function main() {
  setInterval(() => {
    LOGGER.info('Miau')
  }, 5000)
}

main()
