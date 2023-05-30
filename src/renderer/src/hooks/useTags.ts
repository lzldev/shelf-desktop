import {Tag} from 'src/main/src/db/models'

import {create} from 'zustand'

interface TagStore {
  tags: Tag[]
  isReady: boolean
}

const useTags = create<TagStore>(() => ({
  tags: [],
  isReady: false,
}))

window.api
  .invokeOnMain('getShelfTags')
  .then((tags) => {
    useTags.setState((state) => ({
      ...state,
      tags: tags,
    }))
  })
  .finally(() => {
    useTags.setState((state) => ({
      ...state,
      isReady: true,
    }))
  })

window.api.ipcRendererHandle('updateTags', async () => {
  const newTags = await window.api.invokeOnMain('getShelfTags')

  useTags.setState((state) => ({
    ...state,
    tags: newTags,
  }))
})

export {useTags}
