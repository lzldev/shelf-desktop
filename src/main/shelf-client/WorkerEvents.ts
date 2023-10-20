import {requestClient} from '..'

export function setupWorkerHandlers() {
  const client = requestClient()
  if (!client) {
    throw 'error setting up worker handlers'
  }

  const {ThumbWorker, AiWorker} = client

  ThumbWorker.on('message', (message) => {
    message.type
  })
}
