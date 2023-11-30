import {createHash} from 'crypto'
import {
  FileTuple,
  fileTupleNormalize,
  filterDirectoryTree,
  toFileTuple,
} from '../utils/choki'
import {updateProgress as sendUpdateProgressEvent} from '..'
import {ShelfClient} from './ShelfClient'
import {SHELF_LOGGER} from '../utils/Loggers'

import {canClassify, checkExtension} from '../../renderer/src/utils/Extensions'
import {createReadStream} from 'fs'

import {Effect} from 'effect'
import {CreateDefaultColors} from '../db/ColorControllers'
import {
  CleanupContent,
  CreateContent,
  CreateContentWithPaths,
} from '../db/ContentControllers'
import {ShelfDBConnection} from '../db/ShelfControllers'
import {CreateDefaultTags, getDefaultTags} from '../db/TagsControllers'
import {CreateTagContent} from '../db/TagContentControllers'
import {CreatePaths} from '../db/PathsController'
import {bigint} from 'zod'

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

  choki.on('error', (asd) => {})

  async function shelfOnError(error: Error) {
    // if (!('path' in error)) {
    //   return
    // }
    //
    // const path = error.path as string
    //
    // shelfClient.config.set(
    //   'ignoredPaths',
    //   [...shelfClient.config.get('ignoredPaths', false), path],
    //   false,
    // )
    //
    // choki.unwatch(path)
  }

  async function shelfOnChange(_filePath: string) {
    // if (!shelfClient.ready) {
    //   return
    // }
    //
    // try {
    //   const filePath = normalize(_filePath)
    //   const newHash = await hashFileAsync(filePath)
    //
    //   const content = await Content.findOne({
    //     include: [
    //       {
    //         model: Path,
    //         where: {
    //           path: filePath,
    //         },
    //       },
    //     ],
    //   }).catch((e) => {
    //     throw e
    //   })
    //
    //   await content
    //     ?.update({
    //       hash: newHash,
    //     })
    //     .catch((e) => {
    //       throw e
    //     })
    // } catch (e) {
    //   dialog.showErrorBox('Error [ONCHANGE]', JSON.stringify(e))
    // }
  }

  async function shelfOnUnlink(filePath: string) {
    if (!shelfClient.ready) {
      return
    }

    SHELF_LOGGER.info(filePath)

    const fileTuple = fileTupleNormalize(filePath)

    if (fileTuple[2] === false) {
      SHELF_LOGGER.info(`File DELETE Skipped REASON:"DIR"`)
      return
    }

    const connection = shelfClient.ShelfDB

    const dbPath = await connection
      .selectFrom('Paths')
      .select(['id', 'contentId'])
      .where('path', '=', fileTuple)
      .executeTakeFirst()

    if (!dbPath) {
      SHELF_LOGGER.info(`File DELETE Skipped REASON:"NOT FOUND ON DB"`)
      return
    }

    const deletedPath = await connection
      .deleteFrom('Paths')
      .where('id', '=', dbPath.id)
      .executeTakeFirst()

    if (Number(deletedPath.numDeletedRows) === 0) {
      SHELF_LOGGER.warn(`File DELETE WARNING REASON:"Couldn't delete from DB"`)
      return
    }

    const restOfPathsForContent = await connection
      .selectFrom('Paths')
      .select((eb) => eb.fn.count<number>('id').as('count'))
      .where('contentId', '=', dbPath.contentId)
      .executeTakeFirst()

    if (restOfPathsForContent?.count > 0) {
      return
    }

    const deletedContent = await connection
      .deleteFrom('Contents')
      .where('id', '=', dbPath.contentId)
      .executeTakeFirst()

    if (deletedContent) {
      SHELF_LOGGER.warn(`File DELETE WARNING REASON:"Couldn't delete from DB"`)
      return
    }
  }

  async function shelfOnAdd(filePath: string) {
    if (!shelfClient.ready) {
      return
    }

    const fileTuple = toFileTuple(filePath)

    console.log(`FILE`, fileTuple)
    SHELF_LOGGER.info(`FILE`, fileTuple)

    if (fileTuple[2] === false) {
      SHELF_LOGGER.info(`File Skipped REASON:"DIR"`)
      return
    }

    const connection = shelfClient.ShelfDB
    const fileHash = await hashFileAsync(fileTuple[0]).catch((e) => {
      throw e
    })

    const found = await connection
      .selectFrom('Contents')
      .select(['Contents.hash', 'Contents.id'])
      .where('Contents.hash', '=', fileHash)
      .executeTakeFirst()

    if (found) {
      await CreatePaths(connection, [
        {
          path: fileTuple[0],
          mTimeMs: fileTuple[1],
          contentId: found.id,
        },
      ])
      return
    }

    const newContent = await CreateContent(connection, [
      {
        hash: fileHash,
        extension: fileTuple[2],
      },
    ])

    return CreatePaths(connection, [
      {
        contentId: Number(newContent?.insertId),
        path: fileTuple[0],
        mTimeMs: fileTuple[1],
      },
    ])
  }

  async function shelfOnReady() {
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

    const hashToPathRecord: Record<string, number[]> = {}

    if (!isDBNew) {
      console.time('PATH CLEANUP ->')
      await CleanupShelfDB(shelfClient.ShelfDB, watchedFiles)
      console.timeEnd('PATH CLEANUP ->')
    } else {
      await CreateDefaultColors(shelfClient.ShelfDB)
    }

    const defaultTags = await (isDBNew
      ? CreateDefaultTags(shelfClient.ShelfDB)
      : getDefaultTags(shelfClient.ShelfDB))

    isDBNew &&
      shelfClient.AiWorker.postMessage({
        type: 'update_state',
        data: null,
      })

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

    const entries = Object.entries(hashToPathRecord)

    const createdContents = await CreateContentWithPaths(shelfClient.ShelfDB, {
      contents: entries.map(([hash, paths]) => ({
        hash,
        extension: watchedFiles[paths[0]][2],
      })),
      paths: entries.map(([_, paths]) =>
        paths.map((fileIdx) => ({
          path: watchedFiles[fileIdx][0],
          mTimeMs: watchedFiles[fileIdx][1],
        })),
      ),
    })

    createdContents &&
      (await CreateTagContent(
        shelfClient.ShelfDB,
        createdContents.map((content) => {
          const fileTuple = hashToPathRecord[content.hash].at(0)!
          const extension = watchedFiles[fileTuple][2]
          const type = checkExtension(extension)

          return {
            contentId: content.id,
            tagId: defaultTags[type === 'unrecognized' ? 'document' : type],
          }
        }),
      ))
    ;(
      await shelfClient.ShelfDB.selectFrom('Contents')
        .innerJoin('Paths', 'Contents.id', 'Paths.contentId')
        .select((eb) => [
          'Contents.id',
          'Contents.extension',
          'Contents.hash',
          eb.ref('Paths.path').as('path'),
        ])
        .where('hash', 'in', Object.keys(hashToPathRecord))
        .groupBy('Paths.contentId')
        .execute()
    )
      .filter((content) => canClassify(content.extension))
      .forEach((content) => {
        shelfClient.AiWorker.postMessage({
          type: 'new_file',
          data: {
            id: content.id,
            path: content.path,
          },
        })
      })

    SHELF_LOGGER.info('Wainting for AI Tagging...')

    console.timeEnd('DB ->')

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

    if (shelfClient.config.get('aiWorker')) {
      console.time('Waiting for AIWORKER...')
      await WaitForAIWork()
        .then(() => {
          SHELF_LOGGER.info('Batch FINISHED')
        })
        .catch(() => {
          SHELF_LOGGER.info('AIWORKER TIMED OUT')
        })
      console.timeEnd('Waiting for AIWORKER...')
    }

    shelfClient.ready = true
    onReadyCallback()
  }
}

async function CleanupShelfDB(
  connection: ShelfDBConnection,
  watchedFiles: FileTuple[],
) {
  const dbPaths = await connection.selectFrom('Paths').selectAll().execute()

  const deletedPaths: number[] = []
  const alreadyUpdatedContent = new Set<number>()

  for (const path of dbPaths) {
    const idOnTuple = watchedFiles.findIndex((fileTuple) => {
      return fileTuple[0] === path.path
    })

    const isPathWatched = idOnTuple !== -1

    //File is not Watched . Just Remove it from DB later.
    if (!isPathWatched) {
      // await path.destroy()
      deletedPaths.push(path.id)
      continue
    }

    //File is watched and is the same. just keep as is and skip hashing it later.
    if (path.mTimeMs === watchedFiles[idOnTuple][1]) {
      watchedFiles.splice(idOnTuple, 1)
      continue
    }

    //File was modified . Hash it and update DB.
    const newContentHash = await hashFileAsync(path.path)

    await connection
      .updateTable('Paths')
      .where('id', '=', path.id)
      .set({
        mTimeMs: watchedFiles[idOnTuple][1],
      })
      .executeTakeFirst()

    if (!alreadyUpdatedContent.has(path.contentId)) {
      const updateContent = await connection
        .updateTable('Contents')
        .set({
          hash: newContentHash,
        })
        .where('Contents.id', '=', path.contentId)
        .returning('id')
        .executeTakeFirst()

      alreadyUpdatedContent.add(updateContent?.id ?? -1)

      //Skip adding the file to the DB Later.
      watchedFiles.splice(idOnTuple, 1)
      continue
    }
  }

  const del = await connection
    .deleteFrom('Paths')
    .where('Paths.id', 'in', deletedPaths)
    .execute()

  await CleanupContent(connection)

  SHELF_LOGGER.info(`To be Deleted:${deletedPaths.length}`)
  SHELF_LOGGER.info(`Deleted Paths:${del.at(0)?.numDeletedRows}`)
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
