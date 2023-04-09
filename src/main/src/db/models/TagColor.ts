import {InferAttributes, Optional} from 'sequelize'
import {Column, DataType, HasMany, Model, Table} from 'sequelize-typescript'
import {Tag} from './Tag'
import {Prettify} from '../../../../types/utils'

export type TagColorFields = Prettify<InferAttributes<TagColor>>

interface _TagColor {
  id: number
  name: string
  color: string
  tags?: TagColor[]
}

@Table
class TagColor extends Model<_TagColor, Optional<_TagColor, 'id'>> {
  @Column({type: DataType.TEXT})
  name!: string
  @Column({type: DataType.TEXT})
  color!: string
  @HasMany(() => Tag)
  tags?: Tag[]
}

export {TagColor}
