import { Sequelize } from 'sequelize-typescript'
import { Content, ContentTag, Path, Tag, TagParents } from './models'

const __DBFILENAME = 'taggerdb.tagger'

/* 
    TODO:
    If you need to minify your code, you need to set tableName and modelName 
    in the DefineOptions for @Table annotation.
    sequelize-typescript uses the class name as default name for tableName and modelName.
    When the code is minified the class name will no longer be the originally
    defined one (So that class User will become class b for example).
*/

const createSQLiteDB = (dbPath: string) => {
    return new Sequelize({
        dialect: 'sqlite',
        storage: `${dbPath}/${__DBFILENAME}`,
        logging: false,
    })
}

export const createTaggerDB = async (dbPath: string) => {
    const TaggerDB = createSQLiteDB(dbPath)

    TaggerDB.addModels([Content, Path, Tag, ContentTag, TagParents])

    await TaggerDB.sync()

    return {
        ...TaggerDB.models,
        sequelize: TaggerDB,
    }
}

export type TaggerDBModels = Awaited<ReturnType<typeof createTaggerDB>>
