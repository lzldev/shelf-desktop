import {useEffect, useMemo} from 'react'
//@ts-ignore - different tsconfig scope
import {TaggerConfigType} from 'src/main'
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
