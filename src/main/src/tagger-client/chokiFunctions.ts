import { readFileSync, createReadStream, statSync } from 'fs'
import * as fsPath from 'path'
import { createHash } from 'crypto'
import { flattenDirectoryTree } from '../utils'
import { updateProgress } from '../..'
import { TaggerClient } from './'
import { mockTags } from './mockTags'

export const addTaggerEvents = (
    taggerClient: TaggerClient,
    onReadyCallback: (...any) => void,
) => {
    const { Content, Path, Tag, sequelize } = taggerClient.models
    const choki = taggerClient.choki

    const taggerOnChange = async (filePath: string): Promise<void> => {
        const hash = await hashFileAsync(filePath)

        const path = await Path.findOne({
            where: {
                path: filePath,
            },
            attributes: ['id', 'path'],
            include: [Content],
        })

        await path?.Content?.update({
            hash: hash,
        })
    }

    //FIXME: ---
    const taggerOnAdd = async (filePath: string): Promise<void> => {
        const file = readFileSync(filePath)
        const hash = await hashFileAsync(filePath)

        // const [newPath, pathCreated] = await Path.findCreateFind({
        //   where: {
        //     path: filePath,
        //   },
        //   defaults: {
        //     path: filePath,
        //   },
        // })

        const teste = await Path.findOne({
            where: {
                path: filePath,
            },
        })

        if (teste) {
            return
        }

        const [content] = await Content.findOrCreate({
            where: {
                hash: hash,
            },
            defaults: {
                hash: hash,
                extension: fsPath.parse(filePath).ext,
            },
        })

        const newPath = await Path.create({
            path: filePath,
            ContentId: content.dataValues.id,
        })

        return
    }

    const taggerOnReady = async (): Promise<void> => {
        const flatDirTree = flattenDirectoryTree(choki.getWatched()).filter(
            (p) => !statSync(p).isDirectory(),
        )

        let contentError = 0
        let duplicatePath = 0

        const ContentsTransaction = await sequelize.transaction({
            benchmark: true,
        })

        //REMOVEME : MOCK
        const tagTransaction = await sequelize.transaction()
        for (let i = 0; i < mockTags.length; i++) {
            await Tag.findOrCreate({
                where: {
                    name: mockTags[i].name,
                },
                defaults: {
                    name: mockTags[i].name,
                    parentOnly: false,
                },
                transaction: tagTransaction,
            })
        }
        await tagTransaction.commit()

        const INITHASHES = new Map<string, number>()
        const INITPATHS = new Map<string, number>()

        let lastProgress
        console.time('DB ->')
        for (let i = 0; i < flatDirTree.length; i++) {
            /* 
                REMOVEME:DEBUG
                console.timeLog('DB ->', i) ITER
            */
            const newProgress = i / flatDirTree.length

            if (!lastProgress || newProgress !== lastProgress) {
                updateProgress({
                    key: 'start',
                    value: newProgress,
                })

                lastProgress = newProgress
            }

            const filePath = flatDirTree[i]
            const fileHash = await hashFileAsync(filePath)

            const foundPath = await Path.findOne({
                where: {
                    path: filePath,
                },
            })
            const foundContent = await Content.findOne({
                where: {
                    hash: fileHash,
                },
                attributes: ['id'],
            })

            const tempContent = INITHASHES.get(fileHash)

            if (foundContent !== null || tempContent) {
                if (foundPath === null) {
                    console.log('Duplicate Content - ', filePath)
                    duplicatePath++

                    //FIXME: This causes an error when the path was already registered with another content
                    const createPath = await Path.create(
                        {
                            path: filePath,
                            ContentId:
                                foundContent?.dataValues.id || tempContent,
                        },
                        {
                            include: [Content],
                            transaction: ContentsTransaction,
                        },
                    )
                    INITPATHS.set(filePath, createPath.dataValues.id)
                    continue
                } else {
                    /*
                    FIXME: 
                      Edge case of having an existing Path pointing to a different content
                      if Path.contentId !== FoundContent.id
                    */
                    INITPATHS.set(filePath, foundPath.dataValues.id)
                }
                //This may cause problems if the found Hash is in the TEMPHASH
                if (foundContent !== null) {
                    INITHASHES.set(fileHash, foundContent.dataValues.id)
                }
                continue
            }

            try {
                const content = await Content.create(
                    {
                        hash: fileHash,
                        extension: fsPath.parse(filePath).ext,
                        //@ts-ignore Model is wrong
                        Paths: [
                            //FIXME: this actually tries to  create another path but fails
                            // since filePath is unique so it still works.
                            {
                                path: filePath,
                            },
                        ],
                    },
                    {
                        include: [Path, Tag],
                        transaction: ContentsTransaction,
                    },
                )

                //REMOVEME: MOCK
                await content.addTag(
                    Math.round(Math.random() * mockTags.length),
                    {
                        transaction: ContentsTransaction,
                    },
                )
                INITHASHES.set(fileHash, content.dataValues.id)
            } catch (err) {
                console.log('Error [CHOKI READY] ->', err)
                contentError++
            }
        }
        await ContentsTransaction.commit()
        console.timeEnd('DB ->')

        console.log('Content Errors -> ', contentError)
        console.log('Duplicate Path -> ', duplicatePath)

        taggerClient.ready = true
        onReadyCallback()
    }

    choki.addListener('add', taggerOnAdd)
    choki.addListener('change', taggerOnChange)
    choki.addListener('ready', taggerOnReady)
}

const HASHMAXBYTES = 10485760 - 1 //10mb in bytes -1 bc inclusive

async function hashFileAsync(filePath: string) {
    return new Promise<string>((resolve, reject) => {
        try {
            const stream = createReadStream(filePath, {
                end: HASHMAXBYTES,
            })
            const hash = createHash('md5')

            stream.on('data', (_buff) => {
                hash.update(_buff)
            })
            stream.on('end', () => {
                resolve(hash.digest('hex'))
            })
            stream.on('error', (err) => {
                reject(err)
            })
        } catch (err) {
            reject(err)
        }
    })
}
