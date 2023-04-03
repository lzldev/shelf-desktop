import {useState} from 'react'

let _config = await window.api.invokeOnMain('getConfig')

const useConfig = () => {
  const [config, setConfig] = useState(_config)

  /*TODO: check if i have to remove this listener , and if i can 
    also i can probably move this to module scope and add a let with the function to be run after the update , which i can pass the function setConfig 
  */
  window.api.ipcRendererHandle('configUpdated', async () => {
    const newConfig = await window.api.invokeOnMain('getConfig')
    _config = newConfig
    setConfig(newConfig)
  })

  return {config, setConfig}
}

export {useConfig}
