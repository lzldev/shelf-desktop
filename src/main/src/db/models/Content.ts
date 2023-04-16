import {
  Model,
  Table,
  Column,
  BelongsToMany,
  HasMany,
  DataType,
  Index,
} from 'sequelize-typescript'
import {Tag} from './Tag'
import {Path} from './Path'
import {ContentTag} from './ContentTag'
import {InferAttributes, InferCreationAttributes, Optional} from 'sequelize'
import {NonOptional} from '../../../../types/utils'

export type ContentFields = InferAttributes<Content>
export type ContentCreationFields = NonOptional<
  InferCreationAttributes<Content>
>

interface _Content {
  id: number
  extension: string
  hash: string
  paths?: Path[]
  tags?: Tag[]
}

@Table({
  paranoid: true,
})
class Content extends Model<_Content, Optional<_Content, 'id'>> {
  @Index
  @Column(DataType.TEXT)
  hash!: string
  @Column(DataType.TEXT)
  extension!: string
  @BelongsToMany(() => Tag, () => ContentTag)
  tags!: Tag[]
  @HasMany(() => Path)
  paths!: Path[]
}

export {Content}
