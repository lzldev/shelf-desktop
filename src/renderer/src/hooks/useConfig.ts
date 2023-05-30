//@ts-ignore Moodule Scope
import {ShelfConfigType} from 'src/main/src/ShelfConfig'

import {create} from 'zustand'

type ConfigStore = {
  saveConfig: (...any: any[]) => any
  makeReady: (...any: any[]) => any
  setConfig: (config: Partial<ShelfConfigType>) => any
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
    config: null,
    saveConfig: () => {
      const cfg = get()

      if (!cfg.isReady) {
        return
      }
      window.api.invokeOnMain('saveConfig', get().config as ShelfConfigType)
    },
    makeReady: () => set({isReady: true}),
    setConfig: (newConfig) =>
      set((state) => ({
        config: {...state.config, ...(newConfig as ShelfConfigType)},
      })),
  }
})

const initialConfig = await window.api.invokeOnMain('getConfig')

useConfigStore.setState({
  config: initialConfig,
  isReady: true,
})

export {useConfigStore}
