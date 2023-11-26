import {create} from 'zustand'
import type {Content} from '@models'

type orderParam = 'ASC' | 'DESC'

interface orderStore {
  orderField: keyof Content
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
