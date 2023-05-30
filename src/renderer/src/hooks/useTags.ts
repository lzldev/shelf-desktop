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

const updateTags = async () => {
  const newTags = await window.api.invokeOnMain('getShelfTags')
  useTags.setState({tags: newTags})
}

//Initial Fetch
updateTags().finally(() => {
  useTags.setState((state) => ({
    ...state,
    isReady: true,
  }))
})

window.api.ipcRendererHandle('updateTags', updateTags)

export {useTags}
