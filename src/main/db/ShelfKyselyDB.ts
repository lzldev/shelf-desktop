import {Kysely, SqliteDialect} from 'kysely'
import {ParseJSONResultsPlugin} from 'kysely'
import {DB} from './kysely-types'
import SQLite from 'better-sqlite3'
import {existsSync} from 'fs'
import { join } from 'path'

//@ts-expect-error File is being loaded raw ( as a string ) so no type
import createTableSQL from '../../../prisma/migration.sql?raw'

const __DBEXTENSION = '.shelf'
const __DBFILENAME = `.shelfdb${__DBEXTENSION}`

const createShelfKyselyDB = (dbDir: string) => {
  if (!existsSync(dbDir)) {
    throw ` DB dir nonExistant ${dbDir}`
  }

  const dbPath = join(dbDir,__DBFILENAME)
  const isDbNew = !existsSync(dbPath)

  const sqliteDb = new SQLite(dbPath, {
    fileMustExist: false,
  })

  if (isDbNew) {
    sqliteDb.exec(createTableSQL)
  }

  return new Kysely<DB>({
    log: ['query', 'error'],
    dialect: new SqliteDialect({
      database: sqliteDb,
    }),
    plugins: [new ParseJSONResultsPlugin()],
  })
}

export {createShelfKyselyDB}
