import {InferCreationAttributes} from 'sequelize'
import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Index,
  Model,
  Table,
} from 'sequelize-typescript'
import {Content} from './Content'

interface _Path {
  id: number
  path: string
  mTimeMs?: number
  contentId: number
  content?: Content
}

@Table
class Path extends Model<_Path, InferCreationAttributes<Path, {omit: 'id'}>> {
  @Index
  @Column({type: DataType.TEXT})
  path!: string

  @Column({type: DataType.FLOAT})
  mTimeMs!: number

  @ForeignKey(() => Content)
  @Column({type: DataType.INTEGER})
  contentId?: number

  @BelongsTo(() => Content)
  content?: Content
}

export {Path}
