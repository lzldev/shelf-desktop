import './TagEvents'
import './ContentEvents'
import './ColorEvents'

import {IpcRendererEvents} from '../../../preload/ipcRendererTypes'
import {sendEventToAllWindows} from '../..'

export function sendEventAfter(
  events: (keyof IpcRendererEvents)[],
  func: (...any: any[]) => any,
) {
  return () => {
    const result = func()

    events.forEach((event) => {
      sendEventToAllWindows(event)
    })

    return result
  }
}
