import {create} from 'zustand'
import {Tag} from '@models'

export type ContentQuery =
  | {
      type: 'tag'
      tag: Tag
      operation: 'include' | 'exclude'
    }
  | {
      type: 'path'
      path: string
    }

interface queryStore {
  query: Set<ContentQuery>
  addQuery: (query: ContentQuery) => any
  removeQuery: (query: ContentQuery) => any
  clearQuery: () => any
}

const useContentQueryStore = create<queryStore>()((set, get) => ({
  query: new Set<ContentQuery>(),
  addQuery: (query: ContentQuery) => {
    const prevState = get()
    const newSet = new Set<ContentQuery>(prevState.query)
    newSet.add(query)
    set((s) => ({...s, query: newSet}))
  },
  removeQuery: (query: ContentQuery) => {
    const prevState = get()
    const newSet = new Set<ContentQuery>(prevState.query)

    newSet.delete(query)

    set((s) => ({...s, query: newSet}))
  },
  clearQuery: () => {
    set((s) => ({...s, query: new Set<ContentQuery>()}))
  },
}))

export {useContentQueryStore}
