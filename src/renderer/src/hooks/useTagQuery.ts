import {useState} from 'react'
import {useTags} from './useTags'
export const useTagQuery = () => {
  const {tags} = useTags()
  const [query, setQuery] = useState('')
  const TransformedQuery = query?.split(' ')
  const foundTags = tags.filter((tag) =>
    tag.name
      .toLowerCase()
      .includes(TransformedQuery[TransformedQuery.length - 1].toLowerCase()),
  )

  return {query, setQuery, foundTags}
}
