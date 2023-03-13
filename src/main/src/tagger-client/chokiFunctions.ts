import { readFileSync, createReadStream, statSync } from 'fs'
import * as fsPath from 'path'
import { createHash } from 'crypto'
import { flattenDirectoryTree } from '../utils'
import { updateProgress } from '../..'
import { TaggerClient } from './'
import { mockTags } from './mockTags'
import { Content, Path, Tag } from '../db/models'

export const addTaggerEvents = (
  taggerClient: TaggerClient,
  onReadyCallback: (...any) => void,
) => {
  const { sequelize } = taggerClient.models
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

    await path?.content?.update({
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
      contentId: content.dataValues.id,
    })

    return
  }

  const taggerOnReady = async (): Promise<void> => {
    const flatDirTree = flattenDirectoryTree(choki.getWatched()).filter(
      (p) => !statSync(p).isDirectory(),
    )

    const contentError = 0
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
    const lastPaths = []
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
          value: {
            value: newProgress,
            lastPaths: lastPaths.slice(-2),
          },
        })

        lastProgress = newProgress
      }

      const filePath = flatDirTree[i]
      lastPaths.push(filePath)

      const fileHash = await hashFileAsync(filePath)

      const foundPath = await Path.findOne({
        where: {
          path: filePath,
        },
        transaction: ContentsTransaction,
      })
      const foundContent = await Content.findOne({
        where: {
          hash: fileHash,
        },
        attributes: ['id'],
        transaction: ContentsTransaction,
      })
      const tempContentID = INITHASHES.get(fileHash)

      if (foundContent === null && !tempContentID && foundPath === null) {
        const content = await Content.create(
          {
            hash: fileHash,
            extension: fsPath.parse(filePath).ext,
          },
          {
            include: [Path, Tag],
            transaction: ContentsTransaction,
          },
        )

        const newPath = await Path.create(
          {
            path: filePath,
            contentId: content?.id,
          },
          {
            transaction: ContentsTransaction,
          },
        )

        //REMOVEME: MOCK
        await content.$add('tag', Math.round(Math.random() * mockTags.length), {
          transaction: ContentsTransaction,
        })

        INITHASHES.set(fileHash, content.id)
        INITPATHS.set(filePath, newPath.id)
        continue
      }

      if (tempContentID && foundContent !== null) {
        INITHASHES.set(fileHash, foundContent.id)
      }

      if (foundPath === null && !INITPATHS.get(filePath)) {
        console.log('Duplicate Content -> ', filePath)
        duplicatePath++

        const createPath = await Path.create(
          {
            path: filePath,
          },
          {
            transaction: ContentsTransaction,
          },
        )

        await createPath.update(
          { contentId: foundContent?.id || tempContentID },
          {
            transaction: ContentsTransaction,
          },
        )
      }

      continue
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
