import {Optional} from 'sequelize'
import {
  BelongsToMany,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript'
import {Tag} from './Tag'
import {TagToColor} from './TagToColor'

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

  @ForeignKey(() => Tag)
  @Column({type: DataType.INTEGER})
  tagId?: number

  @BelongsToMany(() => Tag, () => TagToColor)
  tags?: Tag[]
}

export {TagColor}
