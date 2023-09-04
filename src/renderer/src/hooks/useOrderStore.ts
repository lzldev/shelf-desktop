import {create} from 'zustand'
import type {Content} from '@models'

type sequelizeDirections = 'ASC' | 'DESC'

interface orderStore {
  orderField: keyof Content
  orderDirection: sequelizeDirections
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
