import {afterAll, assert, beforeAll, describe, expect, test} from 'vitest'
import {createShelfKyselyDB} from './ShelfKyselyDB'
import {rm} from 'fs/promises'
import {CreateManyContent, ListContent} from './ContentControllers'
import {CreateManyPaths} from './PathsController'
import { ShelfDBInstance } from './ShelfControllers'

let connection: ShelfDBInstance
const DBPath = __dirname + '/test.db'

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
    console.log(`TEST DB PATH ${DBPath}`)
    console.log(`DB TEST -> ${process.versions.modules}`)

    connection = createShelfKyselyDB(DBPath)

    const tables = await connection.introspection.getTables()
    //        ^?  TableMetadata[]
    console.log(`DB Tables:`)
    console.log({tables})
  })
  test('Create a bunch of Content', async () => {
    const arr = []
    for (let a = 0; a < 50; a++) {
      arr.push(rngText())
    }

    const create = await CreateManyContent(
      connection,
      arr.map((v) => ({
        hash: v,
        extension: '.funny',
      })),
    )

    assert(create[0])
    expect(Number(create[0].numInsertedOrUpdatedRows)).toBe(arr.length)

    const crr = await connection.selectFrom('Contents').select('id').execute()

    await CreateManyPaths(
      connection,
      crr.map((v) => {
        console.log(`creating path for ${v.id}`)
        return {
          path: `SomePath.idk ${v}`,
          contentId: v.id,
          mTimeMs: 0,
        }
      }),
    )

    await CreateManyPaths(
      connection,
      crr.map((v) => {
        console.log(`creating path for ${v.id}`)
        return {
          path: `SomePath.idk ${v}`,
          contentId: v.id,
          mTimeMs: 0,
        }
      }),
    )


    return create
  })

  test('ListContentWithPagination', async () => {
    console.log(await connection.selectFrom('Paths').selectAll().execute())
    const result = await ListContent(connection, {
      limit: 10,
      offset: 5,
    })

    console.log(result)
    assert(result)
    expect(result.content.length).toBe(10)
    return result
  })

  test('Count content with offset', async () => {
    const count = await connection
      .selectFrom('Contents')
      .select((eb) => eb.fn.count<number>('id').as('count'))
      .executeTakeFirst()

    const offset = 10

    assert(count)
    expect(count.count - offset).toBe(40)
  })

  test('Create Single Content', async () => {
    const ret = await connection
      .insertInto('Contents')
      .values({
        hash: 'TEST HASH',
        extension: '.extension',
      })
      .executeTakeFirst()

    expect(ret.insertId).toBeTypeOf('bigint')
    console.log('Insert Content id:[', ret.insertId, ']')

    const content = await connection
      .selectFrom('Contents')
      .selectAll()
      .executeTakeFirst()

    expect(content).toBeTruthy()
    console.log('Content: ', content)
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

  test.todo('Content with Tags')

  afterAll(async () => {
    await connection.destroy()
    await rm(DBPath)
  })
})
