import {useEffect, useState} from 'react'
//@ts-ignore
import {IpcRendererEvents} from 'src/preload/ipcRendererTypes'

type ProgressValueType = IpcRendererEvents['updateProgress']['args']

const useProgress = () => {
  const [progress, setProgress] = useState<ProgressValueType>({
    total: 0,
    messages: [],
  })

  useEffect(() => {
    window.api.ipcRendererHandle('updateProgress', (_, args) => {
      setProgress(args)
    })
  }, [])

  return {progress}
}

export {useProgress}
