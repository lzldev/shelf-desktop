import { useEffect, useState } from 'react'
import { Tag } from 'src/main/src/db/models'

const useTags = () => {
  const [tags, setTags] = useState<Tag[]>([])

  useEffect(() => {
    ;(async () => {
      setTags(await window.api.invokeOnMain('getTaggerTags'))
    })()
  }, [])

  return { tags }
}

export { useTags }
