import {createTaggerDB} from '../src/main/src/db/TaggerDB'
import {zJson} from '../src/main/src/zJson'
import {it, describe, afterAll, expect, assert, beforeAll} from 'vitest'
import {rmSync, existsSync, rmdirSync, readdirSync} from 'fs'
import {join} from 'path'
import {Content, ContentTag, Path, Tag} from '../src/main/src/db/models'
import {z} from 'zod'

const __TESTDIR = join(__dirname, 'test/')
const __TESTDBRPATH = join(__TESTDIR, '/taggerdb.tagger')
const __TESTZFILEPATH = join(__TESTDIR, '/.zfilecfg.cfg')

let sequelize
describe('Tagger - DB', async () => {
  sequelize = await (await createTaggerDB(__TESTDIR)).sequelize

  let contentid, tagid

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

    contentid = content.id
  })
  it('Create Tag', async () => {
    let tag = await Tag.build({
      name: 'test_tag',
      parentOnly: false,
    })

    tag = await tag.save()

    console.log('Tag ->', tag.toJSON())

    assert(tag)

    tagid = tag.id
  })
  it('Add Tag to Content', async () => {
    let contentTag = await ContentTag.build({
      contentId: contentid,
      tagId: tagid,
    })

    contentTag = await contentTag.save()

    assert(contentTag)
  })

  it('Content with Everything', async () => {
    const content = await Content.findOne({
      include: [
        {
          model: Tag,
          attributes: {
            include: ['id'],
            exclude: ['updatedAt', 'createdAt'],
          },
        },
        {
          model: Path,
          attributes: {
            exclude: ['updatedAt', 'createdAt'],
            include: ['id', 'path'],
          },
        },
      ],
    })

    assert(content)

    const jsonContent = content.toJSON()
    expect(jsonContent.paths?.length).toBe(1)
    expect(jsonContent.tags?.length).toBe(1)
  })

  it('content NOT WHERE PATH', async () => {
    const content = await Content.findOne({
      include: [
        {
          model: Path,
          where: {
            path: 'pleaseNotBeAtestPath',
          },
        },
      ],
    })

    console.log('DONT FIND ->', content?.toJSON())
    assert(!content)
  })
})

describe('zJson', async () => {
  it('zJson should NOT THROW', () => {
    const config = new zJson(
      __TESTZFILEPATH,
      {
        test: z.string(),
        numba: z.number(),
        arr: z.array(z.number()),
      },
      {
        test: 'Hello ,Tester',
        numba: 1234,
        arr: [1, 2, 3],
      },
    )

    config.save(true)
    config.load()

    expect(config.get('test')).eq('Hello ,Tester')

    config.set('test', 'Bye ,Tester', true)
    config.load()

    expect(config.get('test')).eq('Bye ,Tester')

    expect(config.get('arr'))
      .instanceOf(Array)
      .containSubset([1, 2, 3])
      .not.containSubset([4, 5, 6])

    config.set('arr', [4, 5, 6], true)

    expect(config.load()).eq(true)

    expect(config.get('arr'))
      .instanceOf(Array)
      .containSubset([4, 5, 6])
      .not.containSubset([1, 2, 3])

    console.log('final CFG ->', config.getAll())
  })

  afterAll(async () => {
    await sequelize.close()
    if (existsSync(__TESTDIR)) {
      readdirSync(__TESTDIR).forEach((p) => {
        rmSync(join(__TESTDIR, p))
      })
    }
  })
})
