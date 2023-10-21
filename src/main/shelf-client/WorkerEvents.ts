import {requestClient} from '..'
import {SHELF_LOGGER} from '../utils/Loggers'
import {receiveWorkerMessage} from '../utils/Worker'
import {AiWorkerReceive} from './ai_worker/types'
import {ThumbWorkerReceive} from './thumbworker/types'

export function setupWorkerHandlers() {
  const client = requestClient()
  if (!client) {
    throw 'error setting up worker handlers'
  }

  const {ThumbWorker, AiWorker} = client

  receiveWorkerMessage<ThumbWorkerReceive>(ThumbWorker, {
    image_ready: (message) => {
      //TODO:Implement
      SHELF_LOGGER.info(`image previewerwd ${message.data.hash}`)
    },
    image_error: (message) => {
      //TODO:Implement
      SHELF_LOGGER.error(`error :c ${message.data.hash}`)
    },
  })

  receiveWorkerMessage<AiWorkerReceive>(AiWorker, {})
}
