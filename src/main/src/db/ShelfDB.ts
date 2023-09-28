console.log('[SHELFDB] DIR ', import.meta.url)

import SQLite from 'sqlite3'
import { Sequelize } from 'sequelize-typescript'
import { Content, ContentTag, Path, Tag, TagColor } from './models'

export const __DBEXTENSION = '.shelf'
export const __DBFILENAME = `.shelfdb${__DBEXTENSION}`

/*
    TODO:
    If you need to minify your code, you need to set tableName and modelName
    in the DefineOptions for @Table annotation.
    sequelize-typescript uses the class name as default name for tableName and modelName.
    When the code is minified the class name will no longer be the originally
    defined one (So that class User will become class b for example).
*/

// import { SHELF_LOGGER } from '../utils/Loggers'

const createSQLiteDB = (dbPath: string) => {
  return new Sequelize({
    dialect: 'sqlite',
    logging: false,
    dialectOptions: {
      // mode: [SQLite.OPEN_CREATE, SQLite.OPEN_READWRITE, SQLite.OPEN_FULLMUTEX],
    },
    storage: `${dbPath}/${__DBFILENAME}`,
  })
}

export const createShelfDB = async (dbPath: string) => {
  const ShelfDB = createSQLiteDB(dbPath)

  ShelfDB.addModels([Content, Path, Tag, TagColor, ContentTag])

  await ShelfDB.sync()

  const [results] = await ShelfDB.query('PRAGMA journal_mode = WAL;')
  const [results_sync] = await ShelfDB.query('PRAGMA synchronous = 1;') // 1 = NORMAL

  console.log('PRAGMA RUN : ', results)
  console.log('SYNC RUN : ', results_sync)

  process.on('SIGINT', async () => {
    await ShelfDB.close()
  })

  process.on('exit', async () => {
    await ShelfDB.close()
  })

  return {
    ...ShelfDB.models,
    sequelize: ShelfDB,
  }
}

export type ShelfDBModels = Awaited<ReturnType<typeof createShelfDB>>
