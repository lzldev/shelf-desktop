import {create} from 'zustand'
import type {ContentFields} from 'src/main/src/db/models/Content'

type sequelizeDirections = 'ASC' | 'DESC'

interface orderStore {
  orderField: keyof ContentFields
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
