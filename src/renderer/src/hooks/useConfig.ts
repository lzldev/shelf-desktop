//@ts-ignore Moodule Scope
import {ShelfConfigType} from 'src/main/src/ShelfConfig'

import {create} from 'zustand'

type ConfigStore = {
  saveConfig: (...any: any[]) => any
  makeReady: (...any: any[]) => any
  setConfig: (config: Partial<ShelfConfigType>) => any
  modified: boolean
} & (
  | {
      isReady: true
      config: ShelfConfigType
    }
  | {
      isReady: false
      config: null
    }
)

const useConfigStore = create<ConfigStore>((set, get) => {
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
        'saveConfig',
        get().config as ShelfConfigType,
      )

      set({modified: false})
    },
    makeReady: () => set({isReady: true}),
    setConfig: (newConfig) =>
      set((state) => ({
        config: {...state.config, ...(newConfig as ShelfConfigType)},
        modified: true,
      })),
  }
})

const initialConfig = await window.api.invokeOnMain('getConfig')

useConfigStore.setState({
  config: initialConfig,
  isReady: true,
})

export {useConfigStore}
