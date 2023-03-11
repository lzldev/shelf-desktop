import {
    Model,
    InferAttributes,
    InferCreationAttributes,
    CreationOptional,
    BelongsToManyAddAssociationMixin,
    BelongsToManySetAssociationsMixin,
    BelongsToManyRemoveAssociationMixin,
    BelongsToManyGetAssociationsMixin,
    BelongsToManyHasAssociationMixin,
    BelongsToManyCountAssociationsMixin,
    BelongsToCreateAssociationMixin,
    NonAttribute,
    Association,
} from 'sequelize'
import { Content } from './Content'

class Tag extends Model<
    InferAttributes<Tag, { omit: 'Files' | 'Parents' }>,
    InferCreationAttributes<Tag, { omit: 'Files' | 'Parents' }>
> {
    declare id: CreationOptional<number>
    declare name: string
    declare parentOnly: boolean

    declare getFile: BelongsToManyGetAssociationsMixin<Content>
    declare addFile: BelongsToManyAddAssociationMixin<Content, number>
    declare addFiles: BelongsToManyAddAssociationMixin<Content, number>
    declare setFile: BelongsToManySetAssociationsMixin<Content, number>
    declare removeFile: BelongsToManyRemoveAssociationMixin<Content, number>
    declare removeFiles: BelongsToManyRemoveAssociationMixin<Content, number>
    declare hasFile: BelongsToManyHasAssociationMixin<Content, number>
    declare hasFiles: BelongsToManyHasAssociationMixin<Content, number>
    declare countFiles: BelongsToManyCountAssociationsMixin
    declare createFile: BelongsToCreateAssociationMixin<Content>

    declare Files?: NonAttribute<Content[]>

    declare getParents: BelongsToManyGetAssociationsMixin<Tag>
    declare addParent: BelongsToManyAddAssociationMixin<Tag, number>
    declare addParents: BelongsToManyAddAssociationMixin<Tag, number>
    declare setParents: BelongsToManySetAssociationsMixin<Tag, number>
    declare removeParent: BelongsToManyRemoveAssociationMixin<Tag, number>
    declare removeParents: BelongsToManyRemoveAssociationMixin<Tag, number>
    declare hasParent: BelongsToManyHasAssociationMixin<Tag, number>
    declare hasParents: BelongsToManyHasAssociationMixin<Tag, number>
    declare countParents: BelongsToManyCountAssociationsMixin
    declare createParent: BelongsToCreateAssociationMixin<Tag>

    declare Parents?: NonAttribute<Tag[]>

    public declare static associations: {
        tags: Association<Tag, Content>
        parents: Association<Tag, Tag>
    }
}

export { Tag }
