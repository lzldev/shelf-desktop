import {useEffect, useState} from 'react'
//@ts-ignore - tsconfig scope
import {TagColor} from 'src/main/src/db/models'

function mapFromColors(colors: TagColor[]) {
  const colorsMap = new Map<number, TagColor>()
  colors.forEach((value) => {
    colorsMap.set(value.id, value)
  })

  return colorsMap
}

let _colors: Map<number, TagColor>

try {
  _colors = mapFromColors(await window.api.invokeOnMain('getTaggerColors'))
} catch (er) {
  console.log('not ready yet')
}

const useColors = () => {
  const [colors, setColors] = useState<Map<number, TagColor>>(_colors)

  useEffect(() => {
    const listener = async () => {
      const newColors = await window.api.invokeOnMain('getTaggerColors')
      _colors = mapFromColors(newColors)
      setColors(_colors)
    }

    window.api.ipcRendererHandle('updateColors', listener)
    return () => {
      window.electron.ipcRenderer.removeListener('updateColors', listener)
    }
  }, [])

  return {colors}
}

export {useColors}
