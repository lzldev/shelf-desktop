import { useEffect, useState } from 'react'

const useProgress = () => {
    const [progress, setProgress] = useState<Map<string, number>>(new Map())

    useEffect(() => {
        window.api.ipcRendererHandle('updateProgress', (_, args) => {
            setProgress(new Map(progress.set(args.key, args.value)))
        })
    }, [])

    return { progress }
}

export { useProgress }
