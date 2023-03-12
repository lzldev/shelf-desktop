import { createTaggerDB } from '../src/main/src/db/TaggerDB'
import { it, describe, afterAll, expectTypeOf, expect, assert } from 'vitest'
import { rmSync, existsSync } from 'fs'
import { join } from 'path'
import { Content, Path } from '../src/main/src/db/models'

const __TESTDIR = join(__dirname, './')
const __TESTDBRPATH = join(__TESTDIR, '/taggerdb.tagger')

describe('Tagger - DB', async () => {
  if (existsSync(__TESTDBRPATH)) {
    rmSync(__TESTDBRPATH)
  }

  const { sequelize } = await createTaggerDB(__TESTDIR)

  it('Create content with Path', async () => {
    const path = await Path.build({
      path: 'testPath',
    }).save()

    let content = await Content.build({
      extension: '.rng',
      hash: '11233445567',
    }).save()

    content = (await content.$add('path', path)) as Content

    content = await content.reload({
      include: [Path],
    })

    console.log('Content ->', content.toJSON())
    expect(content?.paths?.length).eq(1)
  })
  it('List Created Content with Path', async () => {
    const content = await Content.findOne({
      limit: 1,
      include: [Path],
    })
    assert(content)
    expect(content.toJSON().paths?.length).eq(1)
  })

  afterAll(async () => {
    await sequelize.close()
    rmSync(__TESTDBRPATH)
  })
})
