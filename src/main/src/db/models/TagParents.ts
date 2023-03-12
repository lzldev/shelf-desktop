import {
    Model,
    Table,
    Column,
    ForeignKey,
    DataType,
} from 'sequelize-typescript'
import { Tag } from './Tag'

@Table
class TagParents extends Model {
    @ForeignKey(() => Tag)
    @Column({ type: DataType.INTEGER })
    tagId!: number
    @ForeignKey(() => Tag)
    @Column({ type: DataType.INTEGER })
    parentId!: number
}

export { TagParents }
