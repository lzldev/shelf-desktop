import { Sequelize, DataTypes } from 'sequelize'
import { Content, Path, Tag } from './models'

const __DBFILENAME = 'taggerdb.tagger'

const createSQLiteDB = (dbPath: string) => {
    return new Sequelize({
        dialect: 'sqlite',
        storage: `${dbPath}/${__DBFILENAME}`,
        logging: false,
    })
}

export const createTaggerDB = async (dbPath: string) => {
    const TaggerDB = createSQLiteDB(dbPath)

    const TaggerContent = Content.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            extension: {
                type: DataTypes.STRING,
            },
            hash: {
                type: DataTypes.STRING,
                unique: true,
            },
        },
        {
            sequelize: TaggerDB,
            indexes: [
                {
                    unique: true,
                    fields: ['hash'],
                },
            ],
        },
    )

    const TaggerTag = Tag.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            name: {
                type: DataTypes.STRING,
            },
            parentOnly: {
                type: DataTypes.BOOLEAN,
            },
        },
        {
            sequelize: TaggerDB,
        },
    )

    const TaggerPath = Path.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            path: {
                type: DataTypes.STRING,
                unique: true,
            },
        },
        {
            sequelize: TaggerDB,
            indexes: [
                {
                    unique: true,
                    fields: ['path'],
                },
            ],
        },
    )

    Content.hasMany(Path, { sourceKey: 'id' })
    Path.belongsTo(Content, { targetKey: 'id' })

    Content.belongsToMany(Tag, {
        through: 'FileParents',
    })

    Tag.belongsToMany(Content, {
        through: 'FileParents',
    })
    Tag.belongsToMany(Tag, {
        through: 'TagParents',
        as: 'Parent',
    })

    await TaggerDB.sync()

    return {
        Tag: TaggerTag,
        Content: TaggerContent,
        Path: TaggerPath,
        sequelize: TaggerDB,
    }
}

export type TaggerDBModels = Awaited<ReturnType<typeof createTaggerDB>>
