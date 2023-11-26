import {useMemo, useState} from 'react'
import {useTags} from './useTags'

export const useTagQuery = () => {
  const {tags} = useTags((state) => ({tags: state.tags}))
  const [query, setQuery] = useState('')
  const SplitQuery = query?.split(' ')

  const foundTags = useMemo(
    () =>
      Array.from(tags.values())
        .filter((tag) =>
          tag.name
            .toLowerCase()
            .includes(SplitQuery[SplitQuery.length - 1].toLowerCase()),
        )
        .map((tag) => tag.id),
    [query, tags],
  )

  return {query, setQuery, foundTags, SplitQuery}
}
