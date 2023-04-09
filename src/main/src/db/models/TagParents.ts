import {
  Model,
  Table,
  Column,
  ForeignKey,
  DataType,
  Index,
} from 'sequelize-typescript'
import {Tag} from './Tag'

@Table
class TagParents extends Model {
  @Index
  @ForeignKey(() => Tag)
  @Column({type: DataType.INTEGER})
  tagId!: number
  @Index
  @ForeignKey(() => Tag)
  @Column({type: DataType.INTEGER})
  parentId!: number
}

export {TagParents}
