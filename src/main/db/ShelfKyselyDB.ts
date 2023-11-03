import {Kysely, SqliteDialect} from 'kysely'
import {DB} from './kysely-types'
import SQLite from 'better-sqlite3'
import {__DBFILENAME} from './ShelfDB'
import {existsSync} from 'fs'

//@ts-expect-error error here means we gucci
import createTableSQL from '../../../prisma/migration.sql?raw'

const createShelfKyselyDB = (dbPath: string) => {
  const db_existed = existsSync(dbPath)

  const sqliteDb = new SQLite(dbPath, {
    fileMustExist: false,
  })

  if (!db_existed) {
    console.log("Start...")
    sqliteDb.exec(createTableSQL)
  }

  return new Kysely<DB>({
    log: ['query'],
    dialect: new SqliteDialect({
      database: sqliteDb,
    }),
  })
}

export {createShelfKyselyDB}
