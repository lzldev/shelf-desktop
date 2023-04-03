import {useEffect, useState} from 'react'
//@ts-ignore - different tsconfig scope
import {TaggerConfigType} from 'src/main'

let _config = await window.api.invokeOnMain('getConfig')

const useConfig = () => {
  const [config, setConfig] = useState(_config)

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

  const saveConfig = (newConfig: TaggerConfigType) => {
    window.api.invokeOnMain('saveConfig', newConfig)
    setConfig(newConfig)
  }

  return {config, saveConfig}
}

export {useConfig}
