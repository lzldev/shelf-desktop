import 'reflect-metadata'
import {
  Model,
  Table,
  Column,
  ForeignKey,
  DataType,
  Index,
} from 'sequelize-typescript'

import {Tag} from './Tag'
import {Content} from './Content'
import {InferAttributes, InferCreationAttributes, Optional} from 'sequelize'
import {NonOptional} from '../../../types/utils'

export type ContentTagFields = InferAttributes<ContentTag>
export type ContentTagCreationFields = NonOptional<
  InferCreationAttributes<ContentTag>
>

interface _ContentTag {
  id: number
  contentId: number
  tagId: number
}

@Table
class ContentTag extends Model<_ContentTag, Optional<_ContentTag, 'id'>> {
  @Index
  @Column({type: DataType.INTEGER})
  @ForeignKey(() => Content)
  declare contentId: number

  @Index
  @Column({type: DataType.INTEGER})
  @ForeignKey(() => Tag)
  declare tagId: number
}

export {ContentTag}
