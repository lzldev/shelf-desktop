import 'reflect-metadata'
import {InferAttributes, InferCreationAttributes, Optional} from 'sequelize'
import {Column, DataType, HasMany, Model, Table} from 'sequelize-typescript'
import {Tag} from './Tag'
import {NonOptional} from '../../../../types/utils'

export type TagColorFields = InferAttributes<TagColor>
export type TagColorCreationFields = NonOptional<
  InferCreationAttributes<TagColor>
>

interface _TagColor {
  id: number
  name: string
  color: string
  tags?: TagColor[]
}

@Table
class TagColor extends Model<_TagColor, Optional<_TagColor, 'id'>> {
  @Column({type: DataType.TEXT})
  declare name: string
  @Column({type: DataType.TEXT})
  declare color: string
  @HasMany(() => Tag)
  declare tags?: Tag[]
}

export {TagColor}
