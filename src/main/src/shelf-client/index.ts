import './TagEvents'
import './ContentEvents'
import './ColorEvents'

import {IpcRendererEvents} from '../../../preload/ipcRendererTypes'
import {sendEventToAllWindows} from '../..'

export function sendEventAfter(
  events: (keyof IpcRendererEvents)[],
  func: (...any: any[]) => any,
) {
  return (...args: any[]) => {
    const result = func.call(undefined, ...args)

    events.forEach((event) => {
      sendEventToAllWindows(event)
    })

    return result
  }
}
