import {parse} from 'path'
import {createHash} from 'crypto'
import {FileTuple, filterDirectoryTree} from '../utils/choki'
import {updateProgress as sendUpdateProgressEvent} from '..'
import {ShelfClient} from './ShelfClient'
import {Content, Path, TagColor} from '../db/models'
import {normalize} from 'path'
import {dialog} from 'electron'
import {SHELF_LOGGER} from '../utils/Loggers'

import {canClassify} from '../../renderer/src/utils/Extensions'
import {createReadStream, statSync} from 'fs'
import {defaultColors} from '../utils/DefaultColors'

import {Effect} from 'effect'

export const addChokiEvents = (
  shelfClient: ShelfClient,
  onReadyCallback: (...args: any[]) => void,
) => {
  const choki = shelfClient.choki

  choki.on('error', shelfOnError)

  choki.on('ready', () =>
    shelfOnReady().catch((e) => {
      console.error(e)
    }),
  )
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
        console.log('THIS IS RUNNIGN ?!?!AS FDASPOF MAOPFSM OA{S FM}')
        shelfClient.AiWorker.postMessage({
          type: 'new_file',
          data: {
            id: content.id,
            path: filePath,
          },
        })
      }

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
    shelfClient.config.save() // FIXME:why im doing this here ?

    const isDBNew = shelfClient.config.isNew
    const watchedFiles = filterDirectoryTree(choki.getWatched())

    const progressRecord = {
      AI: watchedFiles.length,
      SHELF: watchedFiles.length,
    }

    const {addToKey} = createProgressUpdater(progressRecord)

    shelfClient.AiWorker.on('message', (message) => {
      if (message.type !== 'tagged_file') {
        return
      }
      addToKey('AI', `[AI] File Tagged ${message?.data?.path}`)
    })

    console.time('DB ->')

    if (!isDBNew) {
      console.time('DB CLEANUP ->')
      await CleanupShelfDB(watchedFiles)
      console.timeEnd('DB CLEANUP ->')
    } else {
      await TagColor.bulkCreate(defaultColors)
    }

    const hashToPathRecord: Record<string, number[]> = {}

    await Effect.runPromise(
      Effect.all(
        watchedFiles.map((v, watchedFileIndex) =>
          Effect.promise(async () => {
            const hash = await hashFileAsync(v[0]).catch((e) => {
              console.error(e)
              throw e
            })

            addToKey('SHELF', v[0])

            if (!hashToPathRecord[hash]) {
              hashToPathRecord[hash] = []
            }
            hashToPathRecord[hash].push(watchedFileIndex)
            return
          }),
        ),
        {
          concurrency: 'unbounded',
        },
      ),
    )

    await Content.bulkCreate(
      Object.entries(hashToPathRecord).map(([hash, paths]) => ({
        hash: hash,
        extension: watchedFiles[paths[0]][2],
        paths: paths.map(
          (fileIdx) =>
            ({
              path: watchedFiles[fileIdx][0],
              mTimeMs: watchedFiles[fileIdx][1],
            } as Path),
        ),
      })),
      {
        include: [{model: Path, as: 'paths'}],
      },
    )
    ;(
      await Content.findAll({
        where: {
          hash: Object.keys(hashToPathRecord),
        },
      })
    )
      .filter((content) => canClassify(content.extension))
      .forEach((content) => {
        // shelfClient.AiWorker.postMessage({
        //   type: 'new_file',
        //   data: {
        //     id: content.id,
        //     path: watchedFiles[hashToPathRecord[content.hash][0]][0],
        //   },
        // })

        //REMOVEME:
        //TODO:
        if (content.extension !== '.jfif') {
          shelfClient.ThumbWorker.postMessage({
            type: 'resize_image',
            data: {
              filePath: watchedFiles[hashToPathRecord[content.hash][0]][0],
              hash: content.hash,
            },
          })
        }
      })

    SHELF_LOGGER.info('Wainting for AI Tagging...')

    console.timeEnd('DB ->')
    console.time('Waiting for AIWORKER...')

    const WaitForAIWork = async () => {
      return new Promise((resolve, reject) => {
        shelfClient.AiWorker.postMessage({
          type: 'emit_batch',
          data: undefined,
        })

        shelfClient.AiWorker.on('message', (data) => {
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

const HASHMAXBYTES = 10485760 - 1 //10 MB

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

  const progress = Object.entries(parts).map(([key], i) => {
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

  const orphanedContents = await Content.findAll({
    attributes: ['id'],
    include: [
      {
        model: Path,
        required: false,
      },
    ],
    where: {
      '$Paths.contentId$': null,
    },
    subQuery: false,
  })

  const cleaned = await Content.destroy({
    where: {
      id: orphanedContents.map((v) => v.id),
    },
  })

  console.log('[Content] Found : ', orphanedContents.length)
  console.log('[Content] Cleaned : ', cleaned)
}
