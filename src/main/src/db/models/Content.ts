import {
    Model,
    Table,
    Column,
    BelongsToMany,
    HasMany,
    DataType,
} from 'sequelize-typescript'
import { Tag } from './Tag'
import { Path } from './Path'
import { ContentTag } from './ContentTag'
import { Optional } from 'sequelize'

interface _Content {
    id: number
    extension: string
    hash: string
    paths?: Path[]
    tags?: Tag[]
}

@Table
class Content extends Model<_Content, Optional<_Content, 'id'>> {
    @Column(DataType.TEXT)
    hash!: string
    @Column(DataType.TEXT)
    extension!: string
    @BelongsToMany(() => Tag, () => ContentTag)
    tags!: Tag[]
    @HasMany(() => Path)
    paths!: Path[]
}

export { Content }
