import { Optional } from 'sequelize'
import {
    BelongsToMany,
    Column,
    DataType,
    Model,
    Table,
} from 'sequelize-typescript'
import { Content } from './Content'
import { ContentTag } from './ContentTag'
import { TagParents } from './TagParents'

interface _Tag {
    id: number
    name: string
    parentOnly: boolean
    content?: Content
    parents?: Tag[]
}

@Table
class Tag extends Model<_Tag, Optional<_Tag, 'id'>> {
    @Column({ type: DataType.TEXT })
    name!: string
    @Column({ type: DataType.BOOLEAN })
    parentOnly!: boolean

    @BelongsToMany(() => Content, () => ContentTag)
    content?: Content[]

    @BelongsToMany(() => Tag, () => TagParents)
    parents?: Tag[]
}

export { Tag }
