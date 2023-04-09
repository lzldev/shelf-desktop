import {useEffect, useState} from 'react'
//@ts-ignore - tsconfig scope
import {Tag} from 'src/main/src/db/models'

let _tags: Tag[]

try {
  _tags = await window.api.invokeOnMain('getTaggerTags')
} catch (err) {
  console.log('no tags')
}
const useTags = () => {
  const [tags, setTags] = useState<Tag[]>(_tags)

  useEffect(() => {
    const listener = async () => {
      const newTags = await window.api.invokeOnMain('getTaggerTags')
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
