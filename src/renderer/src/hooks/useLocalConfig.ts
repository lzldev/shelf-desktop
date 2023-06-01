//@ts-ignore Moodule Scope
import {ShelfClientConfig} from 'src/main/src/ShelfConfig'

import {create} from 'zustand'

type LocalConfigStore = {
  saveConfig: (...any: any[]) => any
  makeReady: (...any: any[]) => any
  setConfig: (config: Partial<ShelfClientConfig>) => any
  modified: boolean
} & (
  | {
      isReady: false
      config: null
    }
  | {
      isReady: true
      config: ShelfClientConfig
    }
)

const useLocalConfigStore = create<LocalConfigStore>((set, get) => {
  return {
    isReady: false,
    modified: false,
    config: null,
    saveConfig: async () => {
      const cfg = get()

      if (!cfg.isReady) {
        return
      }
      await window.api.invokeOnMain(
        'saveClientConfig',
        get().config as ShelfClientConfig,
      )

      set({
        modified: false,
      })
    },
    makeReady: () => set({isReady: true}),
    setConfig: (newConfig) =>
      set((state) => ({
        config: {...state.config, ...(newConfig as ShelfClientConfig)},
        modified: true,
      })),
  }
})

await window.api
  .invokeOnMain('getClientConfig')
  .then((config) => {
    useLocalConfigStore.setState({
      config: config,
    })
  })
  .finally(() => {
    useLocalConfigStore.setState({
      isReady: true,
    })
  })

console.log('local ->', useLocalConfigStore.getState())

export {useLocalConfigStore}
