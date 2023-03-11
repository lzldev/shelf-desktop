import {
    Model,
    InferAttributes,
    InferCreationAttributes,
    CreationOptional,
    NonAttribute,
    Association,
    BelongsToGetAssociationMixin,
    BelongsToSetAssociationMixin,
    ForeignKey,
} from 'sequelize'

import { Content } from './Content'

class Path extends Model<
    InferAttributes<Path, { omit: 'Content' }>,
    InferCreationAttributes<Path, { omit: 'Content' }>
> {
    declare id: CreationOptional<number>
    declare ContentId: ForeignKey<Content['id']>

    declare path: string

    declare getContent: BelongsToGetAssociationMixin<Content>
    declare setContent: BelongsToSetAssociationMixin<Content, number>

    declare Content?: NonAttribute<Content>
    public declare static associations: {
        Content: Association<Path, Content>
    }
}

export { Path }
