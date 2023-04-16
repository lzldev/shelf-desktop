import {useState} from 'react'
import {useTags} from './useTags'
export const useTagQuery = () => {
  const {tags} = useTags()
  const [query, setQuery] = useState('')
  const SplitQuery = query?.split(' ')
  const foundTags = tags.filter((tag) =>
    tag.name
      .toLowerCase()
      .includes(SplitQuery[SplitQuery.length - 1].toLowerCase()),
  )

  return {query, setQuery, foundTags, SplitQuery}
}
