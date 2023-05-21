import {useEffect} from 'react'
//@ts-ignore Moodule Scope
import {TaggerConfigType} from 'src/main/src/TaggerConfig'
import {useImmer} from 'use-immer'

let _config = await window.api.invokeOnMain('getConfig')

const useConfig = () => {
  const [config, setConfig] = useImmer(_config)

  useEffect(() => {
    const listener = async () => {
      const newConfig = await window.api.invokeOnMain('getConfig')
      _config = newConfig
      setConfig(newConfig)
    }

    window.api.ipcRendererHandle('updateConfig', listener)
    return () => {
      window.electron.ipcRenderer.removeListener('updateConfig', listener)
    }
  }, [])

  const saveConfig = () => {
    window.api.invokeOnMain('saveConfig', config)
  }

  return {config, setConfig, saveConfig}
}

export {useConfig}

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
