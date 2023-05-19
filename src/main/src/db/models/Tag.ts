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
import {TagParents} from './TagParents'
import {TagColor} from './TagColor'
import {NonOptional} from '../../../../types/utils'

export type TagFields = InferAttributes<Tag>
export type TagCreationFields = NonOptional<InferCreationAttributes<Tag>>

interface _Tag {
  id: number
  name: string
  parentOnly: boolean
  colorId?: number
  content?: Content
  parents?: Tag[]
}

@Table
class Tag extends Model<_Tag, Optional<_Tag, 'id'>> {
  @Column({type: DataType.TEXT})
  name!: string

  //REMOVEME: NOT USED
  @Column({type: DataType.BOOLEAN})
  parentOnly!: boolean

  @ForeignKey(() => TagColor)
  @Column({type: DataType.INTEGER, allowNull: true})
  colorId?: number

  @BelongsToMany(() => Content, () => ContentTag)
  content?: Content[]

  @BelongsToMany(() => Tag, () => TagParents)
  parents?: Tag[]
}

export {Tag}
