console.log('[SHELFDB] DIR ', import.meta.url)

import {Sequelize} from 'sequelize-typescript'
import {Content, ContentTag, Path, Tag, TagColor} from './models'

export const __DBEXTENSION = '.shelf'
export const __DBFILENAME = `.shelfdb${__DBEXTENSION}`

const createSQLiteDB = (dbPath: string) => {
  return new Sequelize({
    dialect: 'sqlite',
    logging: false,
    storage: `${dbPath}/${__DBFILENAME}`,
  })
}

export const createShelfDB = async (dbPath: string) => {
  const ShelfDB = createSQLiteDB(dbPath)

  ShelfDB.addModels([Content, Path, Tag, TagColor, ContentTag])

  await ShelfDB.sync()

  const [results] = await ShelfDB.query('PRAGMA journal_mode = WAL;')
  const [results_sync] = await ShelfDB.query('PRAGMA synchronous = 1;')

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
