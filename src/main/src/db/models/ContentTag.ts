import {Model, Table, Column, ForeignKey, DataType} from 'sequelize-typescript'
import {Tag} from './Tag'
import {Content} from './Content'
import {Optional} from 'sequelize'

interface _ContentTag {
  id: number
  contentId: number
  tagId: number
}

@Table
class ContentTag extends Model<_ContentTag, Optional<_ContentTag, 'id'>> {
  @Column({type: DataType.INTEGER})
  @ForeignKey(() => Content)
  contentId!: number

  @Column({type: DataType.INTEGER})
  @ForeignKey(() => Tag)
  tagId!: number
}

export {ContentTag}
