import {create} from 'zustand'
import {Content} from 'src/main/src/db/models'
import {InferAttributes} from 'sequelize'

type contentFields = keyof InferAttributes<Content>
type sequelizeDirections = 'ASC' | 'DESC'

interface sessionStore {
  orderField: contentFields
  orderDirection: sequelizeDirections
  toggleDirection: () => void
}

const useOrderStore = create<sessionStore>()((set) => ({
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
