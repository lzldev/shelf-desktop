import {useEffect, useState} from 'react'
import {TagColor} from 'src/main/src/db/models'
import {useConfigStore} from './useConfig'
import {TagColorFields} from 'src/main/src/db/models/TagColor'

function mapFromColors(colors: TagColor[]) {
  const colorsMap = new Map<number, TagColor>()
  colors.forEach((color) => {
    colorsMap.set(color.id, color)
  })

  return colorsMap
}

let _colors: Map<number, TagColor>

try {
  _colors = mapFromColors(await window.api.invokeOnMain('getShelfColors'))
} catch (er) {
  //TODO: REMOVE LOG
  console.log('not ready yet')
}

const useColors = () => {
  const [colors, setColors] = useState<Map<number, TagColor>>(_colors)
  const {defaultColor: _defaultColor} = useConfigStore().config!

  const defaultColor = {
    id: -1,
    name: 'Default',
    color: _defaultColor,
  } satisfies TagColorFields

  useEffect(() => {
    const listener = async () => {
      const newColors = await window.api.invokeOnMain('getShelfColors')
      _colors = mapFromColors(newColors)
      setColors(_colors)
    }

    window.api.ipcRendererHandle('updateColors', listener)
    return () => {
      window.electron.ipcRenderer.removeListener('updateColors', listener)
    }
  }, [])

  return {colors, defaultColor}
}

export {useColors}
