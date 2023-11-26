import {create} from 'zustand'
import type {Tags} from '../../../main/db/kysely-types'

interface TagStore {
  tags: Map<number, Tags>
  isReady: boolean
}

const useTags = create<TagStore>(() => ({
  tags: new Map<number, Tags>(),
  isReady: false,
}))

const updateTags = async () => {
  const newTags = await window.api.invokeOnMain('getShelfTags')
  const tagsMap = new Map<number, Tags>()

  newTags.forEach((tag) => {
    tagsMap.set(Number(tag.id), tag)
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
