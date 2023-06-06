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
      //TODO: Find a better way to do this?
      return result.then((r) => {
        events.forEach((event) => {
          sendEventToAllWindows(event)
        })
        return r
      })
    }

    events.forEach((event) => {
      sendEventToAllWindows(event)
    })

    return result
  }
}
