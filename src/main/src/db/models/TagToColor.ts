import {Model, Table, Column, ForeignKey, DataType} from 'sequelize-typescript'
import {Tag} from './Tag'
import {TagColor} from './TagColor'

@Table
class TagToColor extends Model {
  @ForeignKey(() => Tag)
  @Column({type: DataType.INTEGER})
  colorId!: number
  @ForeignKey(() => TagColor)
  @Column({type: DataType.INTEGER})
  tagId!: number
}

export {TagToColor}
