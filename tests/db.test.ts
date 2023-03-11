import { createTaggerDB } from '../src/main/src/db/TaggerDB'
import { it, describe, afterAll, expectTypeOf, expect, assert } from 'vitest'
import { rmSync, existsSync } from 'fs'
import { join } from 'path'

const __TESTDIR = join(__dirname, './')
const __TESTDBRPATH = join(__TESTDIR, '/taggerdb.tagger')

describe('Tagger - DB', async () => {
    if (existsSync(__TESTDBRPATH)) {
        rmSync(__TESTDBRPATH)
    }

    const { Path, Content, sequelize, Tag } = await createTaggerDB(__TESTDIR)

    it('Create content with Path', async () => {
        const content = await Content.create(
            {
                hash: '123456789',
                extension: '.ext',
                //@ts-ignore type
                Paths: [
                    {
                        path: 'testpath',
                    },
                ],
            },
            {
                include: [{ model: Path }],
            },
        )

        const contentJSON = content.toJSON()

        //@ts-expect-error type thing
        expectTypeOf(content.toJSON()).extract('Paths').toBeArray()
        //@ts-expect-error type thing
        expect(contentJSON.Paths.length).eq(1)
    })
    it('List Created Content with Path', async () => {
        const content = await Content.findOne({
            limit: 1,
            include: [Path],
        })

        assert(content)

        const contentJSON = content.toJSON()
        //@ts-expect-error type thing
        expectTypeOf(content.toJSON()).extract('Paths').toBeArray()
        //@ts-expect-error type thing
        expect(contentJSON.Paths.length).eq(1)
    })

    afterAll(async () => {
        await sequelize.close()
        rmSync(__TESTDBRPATH)
    })
})
