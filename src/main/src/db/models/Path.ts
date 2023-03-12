import { InferCreationAttributes, Optional } from 'sequelize'
import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript'
import { Content } from './Content'

interface _Path {
  id: number
  path: string
  contentId: number
  content?: Content
}

@Table
class Path extends Model<_Path, InferCreationAttributes<Path, { omit: 'id' }>> {
  @Column({ type: DataType.TEXT })
  path!: string

  @ForeignKey(() => Content)
  @Column({ type: DataType.INTEGER })
  contentId?: number

  @BelongsTo(() => Content)
  content?: Content
}

export { Path }
