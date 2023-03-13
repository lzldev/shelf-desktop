import {useEffect, useState} from 'react'

export class ProgressMap<
  TK extends keyof ProgressType,
  TR extends ProgressType[TK],
> extends Map<TK, TR> {}

const useProgress = () => {
  const [progress, setProgress] = useState(new ProgressMap())

  useEffect(() => {
    window.api.ipcRendererHandle('updateProgress', (_, args) => {
      setProgress(new ProgressMap(progress.set(args.key, args.value)))
    })
  }, [])

  return {progress}
}

type ProgressType = {
  start: {
    value: number
    lastPaths: [string, string, string]
  }
}
export {useProgress}
