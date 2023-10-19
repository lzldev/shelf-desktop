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
}

main()
