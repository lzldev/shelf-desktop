import {afterAll, assert, beforeAll, describe, expect, test} from 'vitest'
import {createShelfKyselyDB} from '../src/main/db/ShelfKyselyDB'
import {readdir, rm} from 'fs/promises'
import {join} from 'path'
import {
  CreateContent,
  CreateContentWithPaths,
  ListContent,
} from '../src/main/db/ContentControllers'
import {defaultColors, defaultTags} from '../src/main/utils/DefaultValues'
import {CreateDefaultColors} from '../src/main/db/ColorControllers'
import {CreateDefaultTags} from '../src/main/db/TagsControllers'

import type {ShelfDBConnection} from '../src/main/db/ShelfControllers'

let connection: ShelfDBConnection

const __DBEXTENSION = '.shelf'
const __DBFILENAME = `.shelfdb${__DBEXTENSION}`

const tempTestPath = './temp/'

const clearTempDir = async () => {
  const files = await readdir(tempTestPath)
  if (files.length === 0) {
    return
  }

  return Promise.allSettled(
    files.map((file) => {
      return rm(tempTestPath + file)
    }),
  )
}

const DBPath = join(__dirname, __DBFILENAME)

describe.only('db-tests', async () => {
  beforeAll(async () => {
    clearTempDir()

    connection = createShelfKyselyDB(tempTestPath)

    const tables = await connection.introspection.getTables()

    console.log(`PROCESS.VERSIONS.MODULES:${process.versions.modules}`)
    console.log(`DBPATH:${DBPath}`)
    console.log(`DB Tables:`)
    console.log({tables})
  })

  afterAll(async () => {
    clearTempDir()
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

  test('List Content with relations using pagination', async () => {
    const result = await ListContent(connection, {
      pagination: {limit: 10, offset: 5},
      query: [],
    })

    console.log(result)
    assert(result)
    expect(result.content.length).toBe(10)
    return result
  })

  test('Insert NOTHING', async () => {
    await CreateContent(connection, [])
    await CreateContentWithPaths(connection, {paths: [], contents: []})
  })
})
