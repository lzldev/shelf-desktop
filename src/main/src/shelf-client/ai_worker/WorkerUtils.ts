import {Worker} from 'node:worker_threads'

export const WaitForWorkerEvent = async (
  worker: Worker,
  messageType: string,
  timeout = 60 * 1000,
) => {
  return new Promise((resolve, reject) => {
    const listener: any = (data: any) => {
      if (data.type !== 'message_type') {
        return
      }

      worker.removeListener('message', listener)
      resolve(true)
    }

    worker.on('message', listener)

    setTimeout(() => {
      reject()
    }, timeout)
  })
}
