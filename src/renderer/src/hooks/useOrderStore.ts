import {Contents} from 'src/main/db/kysely-types'
import {create} from 'zustand'

type orderParam = 'ASC' | 'DESC'

interface orderStore {
  orderField: keyof Contents
  orderDirection: orderParam
  toggleDirection: () => void
}

const useOrderStore = create<orderStore>()((set) => ({
  orderDirection: 'ASC',
  orderField: 'createdAt',
  toggleDirection: () => {
    set((state) => {
      if (state.orderDirection === 'ASC') {
        return {orderDirection: 'DESC'}
      } else {
        return {orderDirection: 'ASC'}
      }
    })
  },
}))

export {useOrderStore}
