//@ts-ignore Moodule Scope
import {TaggerConfigType} from 'src/main/src/TaggerConfig'

import {create} from 'zustand'

type ConfigStore = {
  saveConfig: (...any: any[]) => any
  makeReady: (...any: any[]) => any
  setConfig: (config: Partial<TaggerConfigType>) => any
} & (
  | {
      isReady: true
      config: TaggerConfigType
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
      window.api.invokeOnMain('saveConfig', get().config as TaggerConfigType)
    },
    makeReady: () => set({isReady: true}),
    setConfig: (newConfig) =>
      set((state) => ({
        config: {...state.config, ...(newConfig as TaggerConfigType)},
      })),
  }
})

const initialConfig = await window.api.invokeOnMain('getConfig')

useConfigStore.setState({
  config: initialConfig,
  isReady: true,
})

export {useConfigStore}
