import {createTaggerDB} from '../src/main/src/db/TaggerDB'
import {it, describe, afterAll, expectTypeOf, expect, assert} from 'vitest'
import {rmSync, existsSync} from 'fs'
import {join} from 'path'
import {Content, ContentTag, Path, Tag} from '../src/main/src/db/models'

const __TESTDIR = join(__dirname, './')
const __TESTDBRPATH = join(__TESTDIR, '/taggerdb.tagger')

describe('Tagger - DB', async () => {
  if (existsSync(__TESTDBRPATH)) {
    rmSync(__TESTDBRPATH)
  }

  const {sequelize} = await createTaggerDB(__TESTDIR)

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
    console.log('Content Tag Relation ->', contentTag.toJSON())

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
    console.log('Complete Content -> ', jsonContent)
    expect(jsonContent.paths?.length).toBe(1)
    expect(jsonContent.tags?.length).toBe(1)
  })

  afterAll(async () => {
    await sequelize.close()
    rmSync(__TESTDBRPATH)
  })
})
