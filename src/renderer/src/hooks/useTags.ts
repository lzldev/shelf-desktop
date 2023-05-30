import {useEffect, useState} from 'react'
import {Tag} from 'src/main/src/db/models'

let _tags: Tag[]

try {
  _tags = await window.api.invokeOnMain('getShelfTags')
} catch (err) {
  //TODO: REMOVE LOG
  console.log('no tags')
}
const useTags = () => {
  const [tags, setTags] = useState<Tag[]>(_tags)

  useEffect(() => {
    const listener = async () => {
      const newTags = await window.api.invokeOnMain('getShelfTags')
      _tags = newTags
      setTags(_tags)
    }

    window.api.ipcRendererHandle('updateTags', listener)
    return () => {
      window.electron.ipcRenderer.removeListener('updateTags', listener)
    }
  }, [])

  return {tags}
}

export {useTags}

// import {create} from 'zustand'

// interface TagStore {
//   tags: Tag[]
// }

// const useTagStore = create<TagStore>((set, get) => ({
//   tags: [],
// }))

// const newTags = await window.api.invokeOnMain('getShelfTags')

// useTagStore.setState(() => ({
//   tags: newTags,
// }))

// window.api.ipcRendererHandle('updateTags', async () => {
//   const newTags = await window.api.invokeOnMain('getShelfTags')

//   useTagStore.setState(() => ({
//     tags: newTags,
//   }))
// })
