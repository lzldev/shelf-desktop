import './TagEvents'
import './ContentEvents'
import './ColorEvents'
import './LayoutEvents'

import {IpcRendererEvents} from '../../../preload/ipcRendererTypes'
import {sendEventToAllWindows} from '../..'

export function sendEventAfter(
  events: (keyof IpcRendererEvents)[],
  func: (...any: any[]) => any,
) {
  return (...args: any[]) => {
    const result = func.call(undefined, ...args)
    if (result instanceof Promise) {
      return result.then((result) => {
        events.forEach((event) => {
          sendEventToAllWindows(event)
        })
        return result
      })
    }

    events.forEach((event) => {
      sendEventToAllWindows(event)
    })

    return result
  }
}
