import {createReadStream, statSync} from 'fs'
import * as fsPath from 'path'
import {createHash} from 'crypto'
import {flattenDirectoryTree} from '../utils'
import {updateProgress} from '../..'
import {TaggerClient} from '.'
import {mockTags} from './mockTags'
import {Content, Path, Tag} from '../db/models'
import {toFileTuple} from '../utils/chokiUtils'
import {normalize} from 'path'

export const addChokiEvents = (
  taggerClient: TaggerClient,
  onReadyCallback: (...args: any[]) => void,
) => {
  const {sequelize} = taggerClient.models
  const choki = taggerClient.choki

  const taggerOnReady = async (): Promise<void> => {
    const flatDirTree = flattenDirectoryTree(choki.getWatched()).filter(
      (p) => !statSync(p).isDirectory(),
    )
    const ContentsTransaction = await sequelize.transaction()
    const INITHASHES = new Map<string, number>()
    const INITPATHS = new Map<string, number>()
    const lastPaths: string[] = []
    const newFiles = toFileTuple(flatDirTree)
    //REMOVEME:Debug
    const contentError = 0
    let duplicatePath = 0

    let lastProgress: number | undefined
    const sendUpdateProgress = (newProgress: number, newPath: string) => {
      if (!lastProgress || lastProgress !== newProgress) {
        updateProgress({
          key: 'start',
          value: {
            value: newProgress,
            lastPaths: lastPaths,
          },
        })
        lastProgress = newProgress

        if (lastPaths.length <= 2) {
          lastPaths.shift()
        }
        lastPaths.push(newPath)
      }
    }

    //REMOVEME : MOCK TAGS ---------------------------------------
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
    //------------------------------------------------------------

    if (!taggerClient.config.isNew) {
      const pathTransaction = await sequelize.transaction()
      console.time('DB CLEANUP ->')
      console.time('PATH FINDALL ->')
      const paths = await Path.findAll({
        attributes: {
          exclude: ['updatedAt', 'createdAt'],
        },
        transaction: pathTransaction,
      })
      console.timeEnd('PATH FINDALL ->')

      paths.forEach(
        await (async (dbPath) => {
          const path = dbPath.toJSON()
          const foundPath = newFiles.findIndex((nf) => {
            const bol = nf[0] === path.path
            return bol
          })

          if (foundPath === -1) {
            console.log('CLEANING >', path.path)
            await dbPath.destroy({transaction: pathTransaction})
            return
          }

          if (foundPath !== -1 && path.mTimeMs === newFiles[foundPath][1]) {
            newFiles.splice(foundPath, 1)
            return
          }

          if (path.mTimeMs !== newFiles[foundPath][1]) {
            console.log('UPDATING ->', path.path)
            const newHash = await hashFileAsync(path.path)
            const content = await Content.findOne({
              where: {
                id: path.contentId,
              },
              transaction: pathTransaction,
            })

            await content?.update(
              {
                hash: newHash,
              },
              {
                transaction: pathTransaction,
              },
            )

            await dbPath.update(
              {
                mTimeMs: newFiles[foundPath][1],
              },
              {
                transaction: pathTransaction,
              },
            )
            return
          }
        }),
      )

      await pathTransaction.commit()
      console.timeEnd('DB CLEANUP ->')
    }

    console.time('DB ->')
    for (let i = 0; i < newFiles.length; i++) {
      const [filePath, mTimeMs] = newFiles[i]
      const fileHash = await hashFileAsync(filePath)
      const tempContentID = INITHASHES.get(fileHash)
      sendUpdateProgress(i / newFiles.length, filePath)

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
            mTimeMs: mTimeMs,
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
        duplicatePath++
        const createPath = await Path.create(
          {
            path: filePath,
            mTimeMs: mTimeMs,
          },
          {
            transaction: ContentsTransaction,
          },
        )

        await createPath.update(
          {contentId: foundContent?.id || tempContentID},
          {
            transaction: ContentsTransaction,
          },
        )
      }
    }
    sendUpdateProgress(1, 'Finished')
    await ContentsTransaction.commit()
    console.timeEnd('DB ->')

    console.log('Content Errors -> ', contentError)
    console.log('Duplicate Path -> ', duplicatePath)
    taggerClient.ready = true
    onReadyCallback()
  }

  const taggerOnChange = async (path: string): Promise<void> => {
    const filePath = normalize(path)
    const newHash = await hashFileAsync(filePath)

    const content = await Content.findOne({
      include: [
        {
          model: Path,
          where: {
            path: filePath,
          },
        },
      ],
    })

    await content?.update({
      hash: newHash,
    })
  }

  const taggerOnAdd = async (pathString: string): Promise<void> => {
    const filePath = normalize(pathString)
    const fileHash = await hashFileAsync(filePath)
    const {mtimeMs} = statSync(filePath)

    const [content] = await Content.findOrCreate({
      where: {
        hash: fileHash,
      },
      defaults: {
        hash: fileHash,
        extension: fsPath.parse(filePath).ext,
      },
    })

    const [newPath, created] = await Path.findOrCreate({
      where: {
        path: filePath,
      },
      defaults: {
        path: filePath,
        mTimeMs: mtimeMs,
        contentId: content.id,
      },
    })

    if (created) {
      return
    }

    await newPath.update({
      contentId: content.id,
    })
  }

  const taggerOnUnlink = async (fp: string) => {
    const filePath = normalize(fp)
    const path = await Path.findOne({
      where: {
        path: filePath,
      },
    })

    console.log('FilePath ->', `[${filePath}]`)
    console.log('Unlink ->', path?.toJSON())

    await path?.destroy()
    //FIXME: Removing content here would break file rename
  }

  choki.addListener('unlink', taggerOnUnlink)
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
