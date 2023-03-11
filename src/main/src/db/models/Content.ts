import {
    Model,
    InferAttributes,
    InferCreationAttributes,
    CreationOptional,
    BelongsToManyGetAssociationsMixin,
    BelongsToManyAddAssociationMixin,
    BelongsToManySetAssociationsMixin,
    BelongsToManyRemoveAssociationMixin,
    BelongsToManyHasAssociationMixin,
    BelongsToManyCountAssociationsMixin,
    BelongsToCreateAssociationMixin,
    NonAttribute,
    Association,
    HasManyGetAssociationsMixin,
    HasManyAddAssociationMixin,
    HasManySetAssociationsMixin,
    HasManyRemoveAssociationMixin,
    HasManyHasAssociationMixin,
    HasManyCountAssociationsMixin,
    HasManyCreateAssociationMixin,
} from 'sequelize'
import { Tag } from './Tag'
import { Path } from './Path'

class Content extends Model<
    InferAttributes<Content, { omit: 'Tags' | 'Paths' }>,
    InferCreationAttributes<Content, { omit: 'Tags' | 'Paths' }>
> {
    declare id: CreationOptional<number>
    declare extension: string
    declare hash: string

    declare getTag: BelongsToManyGetAssociationsMixin<Tag>
    declare addTag: BelongsToManyAddAssociationMixin<Tag, number>
    declare addTags: BelongsToManyAddAssociationMixin<Tag[], number>
    declare setTags: BelongsToManySetAssociationsMixin<Tag, number>
    declare removeTag: BelongsToManyRemoveAssociationMixin<Tag, number>
    declare removeTags: BelongsToManyRemoveAssociationMixin<Tag, number>
    declare hasTag: BelongsToManyHasAssociationMixin<Tag, number>
    declare hasTags: BelongsToManyHasAssociationMixin<Tag, number>
    declare countTags: BelongsToManyCountAssociationsMixin
    declare createTag: BelongsToCreateAssociationMixin<Tag>

    declare Tags?: NonAttribute<Tag[]>
    declare Paths?: NonAttribute<Path[]>

    declare getPath: HasManyGetAssociationsMixin<Path>
    declare addPath: HasManyAddAssociationMixin<Path, number>
    declare addPaths: HasManyAddAssociationMixin<Path[], number>
    declare setPath: HasManySetAssociationsMixin<Path, number>
    declare removePath: HasManyRemoveAssociationMixin<Path, number>
    declare removePaths: HasManyRemoveAssociationMixin<Path[], number>
    declare hasPath: HasManyHasAssociationMixin<Path, number>
    declare hasPaths: HasManyHasAssociationMixin<Path[], number>
    declare countPaths: HasManyCountAssociationsMixin
    declare createPath: HasManyCreateAssociationMixin<Path>

    public declare static associations: {
        tags: Association<Content, Tag>
        paths: Association<Content, Path>
    }
}

export { Content }
