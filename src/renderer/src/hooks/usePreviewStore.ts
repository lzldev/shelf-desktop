//@ts-ignore Different TSConfig
import {ShelfIpcRendererListener} from 'src/preload/ipcRendererTypes'
import {create} from 'zustand'

//REMOVEME: temp typers
export type PREVIEW_LISTENER_DATA = Parameters<
  ShelfIpcRendererListener<'preview_response'>
>[1]
export type PREVIEW_LISTENER = (data: PREVIEW_LISTENER_DATA) => void

interface previewListenerStore {
  register: (hash: string, funny: PREVIEW_LISTENER) => void
  unregister: (hash: string) => void
}

const listeners = new Map<string, PREVIEW_LISTENER>()

window.api.ipcRendererHandle('preview_response', (_, data) => {
  console.log(`handling preview current_listeners:${listeners.size}`)

  const listener = listeners.get(data.hash)

  if (!listener) {
    console.log(`none is listening to ${data.hash}`)
    return
  }

  listener(data)
})

const usePreviewListener = create<previewListenerStore>()(() => ({
  register: (hash, func) => {
    listeners.set(hash, func)
  },
  unregister: (hash) => {
    listeners.delete(hash)
  },
}))

export {usePreviewListener}
