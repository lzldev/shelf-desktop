import {parse} from 'path'
import {createHash} from 'crypto'
import {FileTuple, filterDirectoryTree} from '../utils/chokiUtils'
import {updateProgress as sendUpdateProgressEvent} from '..'
import {ShelfClient} from './ShelfClient'
import {Content, Path} from '../db/models'
import {normalize} from 'path'
import {dialog} from 'electron'
import {SHELF_LOGGER} from '../utils/Loggers'
import {AiWorkerInvoke} from './ai_worker/types'

import {canClassify} from '../../renderer/src/utils/formats'
import {createReadStream, statSync} from 'fs'

const ConfirmationDialog = (path: string) =>
  dialog.showMessageBoxSync({
    message: `${path}\nthis folder is too big it may break the program`,
    buttons: ['Ignore Dir', 'Scan dir'],
    noLink: false,
    title: 'Warning',
  })

export const addChokiEvents = (
  shelfClient: ShelfClient,
  onReadyCallback: (...args: any[]) => void,
) => {
  const {sequelize} = shelfClient.ShelfDB
  const choki = shelfClient.choki

  choki.on('error', shelfOnError)

  choki.on('ready', shelfOnReady)
  choki.on('add', shelfOnAdd)
  choki.on('unlink', shelfOnUnlink)
  choki.on('change', shelfOnChange)

  async function shelfOnError(error: Error) {
    if (!('path' in error)) {
      return
    }

    const path = error.path as string

    shelfClient.config.set(
      'ignoredPaths',
      [...shelfClient.config.get('ignoredPaths', false), path],
      false,
    )

    choki.unwatch(path)
  }

  async function shelfOnChange(_filePath: string) {
    if (!shelfClient.ready) {
      return
    }

    try {
      const filePath = normalize(_filePath)
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
      }).catch((e) => {
        throw e
      })

      await content
        ?.update({
          hash: newHash,
        })
        .catch((e) => {
          throw e
        })
    } catch (e) {
      dialog.showErrorBox('Error [ONCHANGE]', JSON.stringify(e))
    }
  }

  async function shelfOnAdd(pathString: string) {
    if (!shelfClient.ready) {
      return
    }

    try {
      const filePath = normalize(pathString)
      const fileHash = await hashFileAsync(filePath).catch((e) => {
        throw e
      })

      const {mtimeMs} = statSync(filePath)

      const [content] = await Content.findOrCreate({
        where: {
          hash: fileHash,
        },
        defaults: {
          hash: fileHash,
          extension: parse(filePath).ext,
        },
      }).catch((e) => {
        throw e
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
      }).catch((e) => {
        throw e
      })

      if (created) {
        return
      }

      if (canClassify(content.extension)) {
        shelfClient.AIWorker.postMessage({
          type: 'new_file',
          data: {
            id: content.id,
            path: filePath,
          },
        })
      }

      //TODO: Hmm
      await newPath
        .update({
          contentId: content.id,
        })
        .catch((e) => {
          throw e
        })
    } catch (e) {
      dialog.showErrorBox('Error', JSON.stringify(e))
    }
  }

  async function shelfOnUnlink(_filePath: string) {
    try {
      const filePath = normalize(_filePath)
      const path = await Path.findOne({
        where: {
          path: filePath,
        },
      }).catch((e) => {
        throw e
      })

      await path?.destroy().catch((e) => {
        throw e
      })
    } catch (e) {
      dialog.showErrorBox('Error', JSON.stringify(e))
    }
  }

  async function shelfOnReady() {
    shelfClient.config.save()

    // const ContentsTransaction = await sequelize.transaction()
    const ContentHashToIDMap = new Map<string, number>()
    const PathToContentIDMap = new Map<string, number>()

    const newFiles = filterDirectoryTree(choki.getWatched())

    const progressRecord = {
      AI: newFiles.length,
      SHELF: newFiles.length,
    }

    const {sendProgress, addToKey} = createProgressUpdater(progressRecord)

    shelfClient.AIWorker.on('message', (message) => {
      if (message.type !== 'tagged_file') {
        return
      }
      addToKey('AI', `[AI] File Tagged ${message?.data?.path}`)
    })

    if (!shelfClient.config.isNew) {
      console.time('DB CLEANUP ->')
      await CleanupShelfDB(newFiles)
      console.timeEnd('DB CLEANUP ->')
    }

    console.time('DB ->')

    for (let i = 0; i < newFiles.length; i++) {
      const [filePath, mTimeMs] = newFiles[i]
      const fileHash = await hashFileAsync(filePath)
      const tempContentID = ContentHashToIDMap.get(fileHash)

      sendProgress('SHELF', i + 1, filePath)

      const foundPath = await Path.findOne({
        where: {
          path: filePath,
        },
        // transaction: ContentsTransaction,
      })

      const foundContent = await Content.findOne({
        where: {
          hash: fileHash,
        },
        attributes: ['id'],
        // transaction: ContentsTransaction,
      })

      //This Content is completely new.
      if (foundContent === null && !tempContentID && foundPath === null) {
        const newContent = await Content.create(
          {
            hash: fileHash,
            extension: parse(filePath).ext,
            paths: [
              {
                path: filePath,
                mTimeMs: mTimeMs,
              } as Path,
            ],
          },
          {
            include: [Path],
          },
        ).catch((e) => {
          SHELF_LOGGER.error(`ERROR ON CONTENT INSERT ${filePath} \n${e}`)
        })

        if (!newContent) {
          continue
        }

        if (newContent && canClassify(newContent.extension)) {
          const sentMessage = {
            type: 'new_file',
            data: {
              id: newContent.id,
              path: filePath,
            },
          } satisfies AiWorkerInvoke

          shelfClient.AIWorker.postMessage(sentMessage)
        } else {
          progressRecord.AI--
        }

        ContentHashToIDMap.set(fileHash, newContent.id)
        PathToContentIDMap.set(filePath, newContent.paths?.at(0)?.id ?? -1)

        continue
      }

      //FIXME: I think this should be !tempContentID
      if (tempContentID && foundContent !== null) {
        ContentHashToIDMap.set(fileHash, foundContent.id)
      }

      //Content is found but path isn't
      if (foundPath === null && !PathToContentIDMap.get(filePath)) {
        await Path.create(
          {
            path: filePath,
            mTimeMs: mTimeMs,
            contentId: foundContent?.id || tempContentID,
          },
          {
            // transaction: ContentsTransaction,
          },
        )
        continue
      }
    }

    SHELF_LOGGER.info('Wainting for AI Tagging...')
    // await ContentsTransaction.commit()

    console.timeEnd('DB ->')
    console.time('Waiting for AIWORKER...')

    const WaitForAIWork = async () => {
      return new Promise((resolve, reject) => {
        shelfClient.AIWorker.postMessage({
          type: 'emit_batch',
          data: undefined,
        })

        shelfClient.AIWorker.on('message', (data) => {
          if (data.type !== 'batch_done') {
            return
          }
          resolve(true)
        })

        setTimeout(() => {
          reject()
        }, 10 * 60 * 1000)
      })
    }

    await WaitForAIWork()
      .then(() => {
        SHELF_LOGGER.info('Batch FINISHED')
      })
      .catch(() => {
        SHELF_LOGGER.info('AIWORKER TIMED OUT')
      })

    console.timeEnd('Waiting for AIWORKER...')

    shelfClient.ready = true
    onReadyCallback()
  }
}

const HASHMAXBYTES = 10485760 - 1 //10mb in bytes -1

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

function createProgressUpdater<TParts extends Record<string, number>>(
  parts: TParts,
) {
  const idxToKeyMap: Record<keyof TParts, number> = {} as Record<
    keyof TParts,
    number
  >

  const progress = Object.entries(parts).map(([key, _], i) => {
    idxToKeyMap[key as keyof TParts] = i
    return 0
  })
  const lastMessages: string[] = []
  let lastProgress = 0

  const sendProgress = (
    key: keyof TParts,
    completion: number,
    message: string,
  ) => {
    progress[idxToKeyMap[key]] = completion / parts[key]
    sendUpdateProgress(message)
  }

  const addToKey = (key: keyof TParts, message: string) => {
    progress[idxToKeyMap[key]] =
      (progress[idxToKeyMap[key]] * parts[key] + 1) / parts[key]
    sendUpdateProgress(message)
  }

  const sendUpdateProgress = (message: string) => {
    const totalParts = 100 / progress.length
    let total = 0

    progress.forEach((v) => {
      total += totalParts * v
    })

    total = total / 100

    if (total !== lastProgress) {
      lastProgress = total

      if (lastMessages.length <= 2) {
        lastMessages.shift()
      }

      lastMessages.push(message)

      sendUpdateProgressEvent({
        total: total,
        messages: lastMessages,
      })
    }
  }

  return {sendProgress, addToKey}
}

async function CleanupShelfDB(watchedFiles: FileTuple[]) {
  const dbPaths = await Path.findAll({
    attributes: {
      exclude: ['updatedAt', 'createdAt'],
    },
    // transaction: pathTransaction,
  })

  for (const path of dbPaths) {
    const pathValues = path.toJSON()
    const idOnTuple = watchedFiles.findIndex((fileTuple) => {
      return fileTuple[0] === pathValues.path
    })

    const isPathWatched = idOnTuple !== -1

    if (!isPathWatched) {
      await path.destroy()
      continue
    }

    if (pathValues.mTimeMs === watchedFiles[idOnTuple][1]) {
      watchedFiles.splice(idOnTuple, 1)
    } else {
      const newContentHash = await hashFileAsync(path.path)
      const updatedContent = await Content.update(
        {
          hash: newContentHash,
        },
        {
          where: {
            id: pathValues.contentId,
          },
        },
      )

      SHELF_LOGGER.info(
        `${
          updatedContent[0] !== 0 ? 'SUCESS' : 'FAIL'
        } ON UPDATING CONTENT ON CLEANUP | Path: ${pathValues.path}`,
      )

      await path.update({
        mTimeMs: watchedFiles[idOnTuple][1],
      })
    }
  }
}
