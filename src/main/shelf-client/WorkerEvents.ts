import {requestClient, sendEventToAllWindows} from '..'
import {receiveWorkerMessage} from '../utils/Worker'
import {AiWorkerReceive} from './ai_worker/types'
import {ThumbWorkerReceive} from './thumbworker/types'

export function setupWorkerHandlers() {
  const client = requestClient()

  if (!client) {
    throw 'Client no found when setting up worker handlers'
  }

  const {ThumbWorker, AiWorker} = client

  receiveWorkerMessage<ThumbWorkerReceive>(ThumbWorker, {
    preview_ready: (message) => {
      sendEventToAllWindows('preview_response', {
        hash: message.data.hash,
        success: true,
      })
    },
    preview_error: (message) => {
      sendEventToAllWindows('preview_response', {
        hash: message.data.hash,
        success: false,
      })
    },
  })

  receiveWorkerMessage<AiWorkerReceive>(AiWorker, {})
}
