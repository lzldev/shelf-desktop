import {afterAll, assert, beforeAll, describe, expect, test} from 'vitest'
import {createShelfKyselyDB} from './ShelfKyselyDB'
import {rm} from 'fs/promises'
import {
  CleanupContent,
  CreateContent,
  CreateContentWithPaths,
  ListContent,
} from './ContentControllers'
import {ShelfDBConnection} from './ShelfControllers'
import {defaultColors, defaultTags} from '../utils/DefaultValues'
import {CreateDefaultColors} from './ColorControllers'
import {join} from 'path'
import {CreateDefaultTags} from './TagsControllers'

let connection: ShelfDBConnection

const __DBEXTENSION = '.shelf'
const __DBFILENAME = `.shelfdb${__DBEXTENSION}`

const DBPath = join(__dirname, __DBFILENAME)

function rngText() {
  const size = Math.floor(Math.random() * 25)
  let s = ''
  for (let a = 0; a < size; a++) {
    s += String.fromCharCode(63 + Math.floor(Math.random() * 25))
  }
  return s
}

describe.only('db-tests', async () => {
  beforeAll(async () => {
    await rm(DBPath, {
      force: true,
    })

    connection = createShelfKyselyDB(__dirname)

    const tables = await connection.introspection.getTables()

    console.log(`PROCESS.VERSIONS.MODULES:${process.versions.modules}`)
    console.log(`DBPATH:${DBPath}`)
    console.log(`DB Tables:`)
    console.log({tables})
  })

  test('Insert default Colors', async () => {
    const colors = await CreateDefaultColors(connection)

    assert(colors)
    expect(Number(colors[0].numInsertedOrUpdatedRows)).toEqual(
      defaultColors.length,
    )
  })

  test('Insert default Tags', async () => {
    const tags = await CreateDefaultTags(connection)

    assert(tags)
    expect(Number(Object.keys(tags).length)).toEqual(defaultTags.length)
  })

  test('Insert 50 Contents with Paths', async () => {
    const arr = []
    for (let a = 0; a < 50; a++) {
      arr.push(rngText())
    }

    const create = await CreateContentWithPaths(connection, {
      paths: arr.map((str) => [
        {
          path: str,
          mTimeMs: 20005,
        },
        {
          path: str,
          mTimeMs: 20005,
        },
      ]),
      contents: arr.map((str) => ({
        hash: str,
        extension: '.asd',
      })),
    })

    return create
  })

  test('List Content with relations using pagination', async () => {
    console.log(await connection.selectFrom('Paths').selectAll().execute())
    const result = await ListContent(connection, {
      pagination: {limit: 10, offset: 5},
      query: [],
    })

    console.log(result)
    assert(result)
    expect(result.content.length).toBe(10)
    return result
  })

  test('Create Color and Tag', async () => {
    const color = await connection
      .insertInto('TagColors')
      .values({
        name: 'Funny Pink',
        color: '#fcb5c6',
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    expect(color.id).toBeTypeOf('number')
    console.log('Insert Color id:[', color.id, ']')

    const tag = await connection
      .insertInto('Tags')
      .values({
        name: 'Test Tag',
        colorId: color.id,
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    expect(tag.id).toBeTypeOf('number')
    console.log('Insert Tag id:[', tag.id, ']')
  })

  test('Clear Orphaned Contents', async () => {
    const max = 2

    const rows = await connection
      .with('last_two', (db) =>
        db
          .selectFrom('Paths')
          .select(['id', 'contentId'])
          .orderBy('id desc')
          .limit(max),
      )
      .deleteFrom('Paths')
      .where((eb) =>
        eb('Paths.id', 'in', eb.selectFrom('last_two').select('last_two.id')),
      )
      .execute()

    assert(rows[0])
    expect(Number(rows[0].numDeletedRows)).toBe(max)

    const currentHashes = (
      await connection.selectFrom('Contents').select('hash').execute()
    ).map((c) => c.hash)

    const res = await CleanupContent(connection)

    assert(res)
    assert(res[0])
    expect(Number(res[0].numDeletedRows)).toBe(max / 2)
  })

  test('Create Single Content', async () => {
    const ret = await connection
      .insertInto('Contents')
      .values({
        hash: 'TEST HASH',
        extension: '.extension',
      })
      .executeTakeFirst()

    assert(ret)
    expect(Number(ret.numInsertedOrUpdatedRows)).toEqual(1)
  })

  test('Insert NOTHING', async () => {
    await CreateContent(connection, [])
    await CreateContentWithPaths(connection, {paths: [], contents: []})
  })

  test('Create Single Content', async () => {
    const ret = await connection
      .insertInto('Contents')
      .values({
        hash: 'TEST HASH',
        extension: '.extension',
      })
      .executeTakeFirst()

    assert(ret)
    expect(Number(ret.numInsertedOrUpdatedRows)).toEqual(1)
  })

  afterAll(async () => {
    await connection.destroy()
    await rm(DBPath)
    console.log('TEST DB Removed')
  })
})
