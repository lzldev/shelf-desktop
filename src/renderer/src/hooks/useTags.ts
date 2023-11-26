import {create} from 'zustand'
import type {Tags} from '../../../main/db/kysely-types'

export type NormalizedTags = Tags & {id: number}

interface TagStore {
  tags: Map<number, NormalizedTags>
  isReady: boolean
}

const useTags = create<TagStore>(() => ({
  tags: new Map<number, NormalizedTags>(),
  isReady: false,
}))

const updateTags = async () => {
  const newTags = await window.api.invokeOnMain('getShelfTags')
  const tagsMap = new Map<number, NormalizedTags>()

  newTags.forEach((tag) => {
    tagsMap.set(Number(tag.id), tag as NormalizedTags)
  })

  useTags.setState({tags: tagsMap})
}

updateTags().finally(() => {
  useTags.setState((state) => ({
    ...state,
    isReady: true,
  }))
})

window.api.ipcRendererHandle('updateTags', updateTags)

export {useTags}
