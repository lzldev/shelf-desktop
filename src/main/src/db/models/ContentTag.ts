import {
  Model,
  Table,
  Column,
  ForeignKey,
  DataType,
} from 'sequelize-typescript'
import { Tag } from './Tag'
import { Content } from './Content'

interface ContentTag {
  id: number
  contentId:number
  tagId:number
}

@Table
class ContentTag extends Model {
  @Column({ type: DataType.INTEGER })
  @ForeignKey(() => Content)
  contentId!: number

  @Column({ type: DataType.INTEGER })
  @ForeignKey(() => Tag)
  tagId!: number
}

export { ContentTag }
