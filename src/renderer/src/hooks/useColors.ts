import {TagColors} from 'src/main/db/kysely-types'
import {create} from 'zustand'

function mapFromColors(colors: TagColors[]) {
  const colorsMap = new Map<number, TagColors>()
  colors.forEach((color) => {
    colorsMap.set(Number(color.id), color)
  })

  return colorsMap
}

interface ColorStore {
  colors: Map<number, TagColors>
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
