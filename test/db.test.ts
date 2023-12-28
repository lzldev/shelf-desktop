import {afterAll, assert, beforeAll, describe, expect, test} from 'vitest'
import {createShelfKyselyDB} from '../src/main/db/ShelfKyselyDB'
import {join} from 'path'
import {
  CreateContent,
  CreateContentWithPaths,
  ListContent,
} from '../src/main/db/ContentControllers'
import {defaultColors, defaultTags} from '../src/main/utils/DefaultValues'
import {CreateDefaultColors} from '../src/main/db/ColorControllers'
import {CreateDefaultTags} from '../src/main/db/TagsControllers'

import {clearTempDir, tempTestPath} from './utils'

import type {ShelfDBConnection} from '../src/main/db/ShelfControllers'

let connection: ShelfDBConnection

describe.only('db-tests', async () => {
  beforeAll(async () => {
    await clearTempDir()

    connection = createShelfKyselyDB(tempTestPath)

    console.log(`PROCESS.VERSIONS.MODULES:${process.versions.modules}`)
  })

  afterAll(async () => {
    await clearTempDir()
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
