import 'reflect-metadata'
import {InferAttributes, InferCreationAttributes} from 'sequelize'
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
import {NonOptional} from '../../../types/utils'

interface _Path {
  id: number
  path: string
  mTimeMs?: number
  contentId: number
  content?: Content
}

export type PathFields = InferAttributes<Path>
export type PathCreationFields = NonOptional<InferCreationAttributes<Path>>

@Table
class Path extends Model<_Path, InferCreationAttributes<Path, {omit: 'id'}>> {
  @Index
  @Column({type: DataType.TEXT})
  declare path: string

  @Column({type: DataType.FLOAT})
  declare mTimeMs: number

  @Index
  @ForeignKey(() => Content)
  @Column({type: DataType.INTEGER})
  declare contentId?: number

  @BelongsTo(() => Content)
  declare content?: Content
}

export {Path}
