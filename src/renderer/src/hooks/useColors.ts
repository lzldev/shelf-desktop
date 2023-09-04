import {TagColor} from 'src/main/src/db/models'

function mapFromColors(colors: TagColor[]) {
  const colorsMap = new Map<number, TagColor>()
  colors.forEach((color) => {
    colorsMap.set(color.id, color)
  })

  return colorsMap
}

import {create} from 'zustand'

interface ColorStore {
  colors: Map<number, TagColor>
  isReady: boolean
}

const useColors = create<ColorStore>(() => ({
  colors: new Map(),
  isReady: false,
}))

const updateTags = async () => {
  const colors = await window.api.invokeOnMain('getShelfColors')
  useColors.setState((state) => ({
    ...state,
    colors: mapFromColors([...colors]),
  }))
}

updateTags().finally(() => {
  useColors.setState((state) => ({
    ...state,
    isReady: true,
  }))
})

window.api.ipcRendererHandle('updateColors', updateTags)

export {useColors}
