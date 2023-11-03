import {afterAll, beforeAll, describe, expect, test} from 'vitest'
import {createShelfKyselyDB} from './ShelfKyselyDB'
import {rm} from 'fs/promises'

let connection: ReturnType<typeof createShelfKyselyDB>

const db_path = __dirname + '/test.db'



describe.only('db-tests', async (context) => {
  beforeAll(async () => {
    await rm(db_path, {
      force: true,
    })
    console.log(`TEST DB PATH ${db_path}`)
    console.log(`DB TEST -> ${process.versions.modules}`)

    try {
      connection = createShelfKyselyDB(db_path)
    } catch (e) {
      throw e
    }
  })

  test('Create Content', async (context) => {
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
        name:"Funny Pink",
        color:"#fcb5c6",
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    expect(color.id).toBeTypeOf('number')
    console.log('Insert Color id:[', color.id, ']')

    const tag = await connection
      .insertInto('Tags')
      .values({
        name: 'Test Tag',
        colorId:color.id,
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    expect(tag.id).toBeTypeOf('number')
    console.log('Insert Tag id:[', tag.id, ']')
  })


  test.todo("Content with Tags")

  afterAll(async () => {
    await connection.destroy()
    await rm(db_path)
  })
})
