import {create} from 'zustand'

type defaultOperations = 'exclude' | 'include' | 'like'

export type ContentQuery =
  | {
      field: 'path'
      value: string
      operation: defaultOperations | 'something else'
    }
  | {
      field: 'tag'
      value: number
      operation: defaultOperations
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
