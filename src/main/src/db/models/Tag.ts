import 'reflect-metadata'
import {InferAttributes, InferCreationAttributes, Optional} from 'sequelize'
import {
  BelongsToMany,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript'
import {Content} from './Content'
import {ContentTag} from './ContentTag'
import {TagColor} from './TagColor'
import {NonOptional} from '../../../../types/utils'

export type TagFields = InferAttributes<Tag>
export type TagCreationFields = NonOptional<InferCreationAttributes<Tag>>

interface _Tag {
  id: number
  name: string
  colorId?: number
  content?: Content
}

@Table
class Tag extends Model<_Tag, Optional<_Tag, 'id'>> {
  @Column({type: DataType.TEXT})
  declare name: string

  @ForeignKey(() => TagColor)
  @Column({type: DataType.INTEGER, allowNull: true})
  declare colorId?: number

  @BelongsToMany(() => Content, () => ContentTag)
  declare content?: Content[]
}

export {Tag}
