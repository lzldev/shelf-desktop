import {
  ShelfFile,
  filterDirectoryTree,
  toShelfDirectoryOrFile,
  isShelfFile,
} from './ShelfFile'
import {updateProgress as sendUpdateProgressEvent} from '..'
import {ShelfClient} from './ShelfClient'
import {SHELF_LOGGER} from '../utils/Loggers'

//TODO: Move those functions off the renderer.
//@ts-ignore Outside TSCONFIG Scope
import {canClassify, checkExtension} from '../../renderer/src/utils/Extensions'

import {CreateDefaultColors} from '../db/ColorControllers'
import {
  CleanupContent,
  CreateContent,
  CreateContentWithPaths,
} from '../db/ContentControllers'
import {ShelfDBConnection} from '../db/ShelfControllers'
import {CreateDefaultTags, getDefaultTags} from '../db/TagsControllers'
import {CreateTagContent} from '../db/TagContentControllers'
import {CreatePaths, UpdatePath} from '../db/PathsController'
import {hashFileAsync, hashShelfFile, hashShelfFiles} from './FileHashing'
import {AiWorkerReceive} from './ai_worker/types'
import {InsertObject} from 'kysely'
import {DB} from '../db/kysely-types'

export const addChokiEvents = (
  shelfClient: ShelfClient,
  onReadyFinished: (...args: any[]) => void,
) => {
  const choki = shelfClient.choki

  choki.on('ready', () =>
    shelfOnReady().catch((error) => {
      SHELF_LOGGER.error('CHOKI-ONREADY', error)
      console.error(error)
    }),
  )

  choki.on('add', shelfOnAdd)
  choki.on('unlink', shelfOnUnlink)
  choki.on('change', shelfOnChange)

  choki.on('error', shelfOnError)
  choki.on('error', (error) => SHELF_LOGGER.error('CHOKI-ERROR', error))

  async function shelfOnError(error: Error) {
    if (!('path' in error)) {
      throw error
    }

    const path = error.path as string

    shelfClient.config.set(
      'ignoredPaths',
      [...shelfClient.config.get('ignoredPaths', false), path],
      false,
    )

    choki.unwatch(path)
  }

  async function shelfOnChange(filePath: string) {
    if (!shelfClient.ready) {
      return
    }

    const shelfFile = toShelfDirectoryOrFile(filePath)

    if (!isShelfFile(shelfFile)) {
      SHELF_LOGGER.info(`Change Skipped ${shelfFile} REASON:"DIR"`)
      return
    }

    SHELF_LOGGER.info(`Change ${shelfFile.filePath}`)

    const connection = shelfClient.ShelfDB

    const file = await connection
      .selectFrom('Paths')
      .select(['Paths.id', 'Paths.path', 'Paths.contentId'])
      .where('Paths.path', '=', shelfFile.filePath)
      .executeTakeFirst()

    if (!file) {
      SHELF_LOGGER.info(`Change ${shelfFile.filePath} | Path not Found`)
      return
    }

    const content = await connection
      .selectFrom('Contents')
      .select(['Contents.id', 'Contents.hash', 'Contents.extension'])
      .where('Contents.id', '=', file.contentId)
      .executeTakeFirst()

    if (!content) {
      SHELF_LOGGER.info(`Change ${shelfFile.filePath} | Content not Found`)
      return
    }

    const newHash = await hashShelfFile(shelfFile)

    if (content.hash === newHash) {
      SHELF_LOGGER.info(
        `Change ${shelfFile.filePath} | Content hash didn't change`,
      )
      return
    }

    ;(async () => {
      await connection
        .updateTable('Paths')
        .where('Paths.contentId', '=', file.contentId)
        .set({
          mTimeMs: shelfFile.modifiedTimeMS,
        })
        .execute()
        .catch((e) => {
          throw e
        })

      await connection
        .updateTable('Contents')
        .where('id', '=', content.id)
        .set({hash: newHash})
        .executeTakeFirstOrThrow()
    })().catch(() => {
      SHELF_LOGGER.error(`Change ${shelfFile.filePath} | Content Update Failed`)
    })
    //TODO: Implement Choki On Change event.
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

    const shelfFile = toShelfDirectoryOrFile(filePath)

    if (!isShelfFile(shelfFile)) {
      SHELF_LOGGER.info(`Unlink Skip  ${shelfFile.filePath} REASON:"DIR"`)
      return
    }

    SHELF_LOGGER.info(`Unlink ${filePath}`)

    const connection = shelfClient.ShelfDB

    const dbPath = await connection
      .selectFrom('Paths')
      .select(['id', 'contentId'])
      .where('path', '=', shelfFile.filePath)
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

    if (!restOfPathsForContent || restOfPathsForContent?.count > 0) {
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

    const shelfFile = toShelfDirectoryOrFile(filePath)

    if (!isShelfFile(shelfFile)) {
      SHELF_LOGGER.info(`File ${shelfFile.filePath} Skipped REASON:"DIR"`)
      return
    }

    SHELF_LOGGER.info(`ADD ${shelfFile.filePath}`)

    const fileHash = await hashShelfFile(shelfFile)

    const connection = shelfClient.ShelfDB
    const found = await connection
      .selectFrom('Contents')
      .select(['Contents.hash', 'Contents.id'])
      .where('Contents.hash', '=', fileHash)
      .executeTakeFirst()

    if (found) {
      await CreatePaths(connection, [
        {
          path: shelfFile.filePath,
          mTimeMs: shelfFile.modifiedTimeMS,
          contentId: found.id,
        },
      ])
      return
    }

    const newContent = await CreateContent(connection, [
      {
        hash: fileHash,
        extension: shelfFile.extension,
      },
    ])

    return CreatePaths(connection, [
      {
        contentId: Number(newContent?.insertId),
        path: shelfFile.filePath,
        mTimeMs: shelfFile.modifiedTimeMS,
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

    if (!isDBNew) {
      await CleanupShelfPaths(shelfClient.ShelfDB, watchedFiles)
    } else {
      await CreateDefaultColors(shelfClient.ShelfDB)
    }

    const defaultTags = await (isDBNew
      ? CreateDefaultTags(shelfClient.ShelfDB)
      : getDefaultTags(shelfClient.ShelfDB))

    if (isDBNew) {
      shelfClient.AiWorker.postMessage({
        type: 'update_state',
        data: null,
      })
    }

    const hashToPathRecord = await hashShelfFiles(watchedFiles, (fileName) =>
      addToKey('SHELF', fileName),
    )

    const contentsAndPaths = Object.entries(hashToPathRecord).reduce(
      (previousValue, [hash, pathIds]) => {
        previousValue.contents.push({
          hash,
          extension: watchedFiles[pathIds[0]].extension,
        })

        previousValue.paths.push(
          pathIds.map((fileIdx) => ({
            path: watchedFiles[fileIdx].filePath,
            mTimeMs: watchedFiles[fileIdx].modifiedTimeMS,
          })),
        )
        return previousValue
      },
      {
        contents: [],
        paths: [],
      } as {
        contents: InsertObject<DB, 'Contents'>[]
        paths: Omit<InsertObject<DB, 'Paths'>, 'contentId'>[][]
      },
    )

    const createdContents = await CreateContentWithPaths(
      shelfClient.ShelfDB,
      contentsAndPaths,
    )

    await CleanupContent(shelfClient.ShelfDB)

    if (!createdContents) {
      onReadyFinished()
      return
    }

    //TODO: Extract into "addFileTypeTag"
    await CreateTagContent(
      shelfClient.ShelfDB,
      createdContents.map((content) => {
        const shelfConfig = hashToPathRecord[content.hash].at(0)!
        const extension = watchedFiles[shelfConfig].extension
        const type = checkExtension(extension)

        return {
          contentId: content.id,
          tagId: defaultTags[type === 'unrecognized' ? 'document' : type],
        }
      }),
    )

    console.timeEnd('DB ->')

    if (shelfClient.config.get('aiWorker')) {
      console.time('Waiting for AIWORKER')

      createdContents.forEach((content) => {
        const fileIdx = hashToPathRecord[content.hash].at(0)
        const shelfFile = watchedFiles.at(fileIdx!)

        if (fileIdx === undefined || shelfFile === undefined) {
          return
        } else if (!canClassify(shelfFile.extension)) {
          return
        }

        shelfClient.AiWorker.postMessage({
          type: 'new_file',
          data: {
            id: content.id,
            path: shelfFile.filePath,
          },
        })
      })

      await waitForAIWorker(shelfClient)
        .then(() => {
          SHELF_LOGGER.info('AIWORKER FINISHED')
        })
        .catch(() => {
          SHELF_LOGGER.info('AIWORKER TIMED OUT')
        })

      console.timeEnd('Waiting for AIWORKER')
    }

    onReadyFinished()
  }
}

const AIWORKER_TIMEOUT = 10 * 60 * 1000 //10 minutes

function waitForAIWorker(client: ShelfClient) {
  return new Promise((resolve, reject) => {
    client.AiWorker.postMessage({
      type: 'emit_batch',
      data: undefined,
    })

    const listener = (data: AiWorkerReceive) => {
      if (data.type !== 'batch_done') {
        return
      }

      client.AiWorker.removeListener('message', listener)
      resolve(true)
    }

    client.AiWorker.on('message', listener)

    setTimeout(() => {
      client.AiWorker.removeListener('message', listener)
      reject()
    }, AIWORKER_TIMEOUT)
  })
}

async function CleanupShelfPaths(
  connection: ShelfDBConnection,
  watchedFiles: ShelfFile[],
) {
  const dbPaths = await connection.selectFrom('Paths').selectAll().execute()

  const deletedPaths: number[] = []
  const alreadyUpdatedContent = new Set<number>()

  for (const path of dbPaths) {
    const shelfFileIndex = watchedFiles.findIndex((shelfFile) => {
      return shelfFile.filePath === path.path
    })

    const isPathWatched = shelfFileIndex !== -1

    //File is not Watched . Just Remove it from DB later.
    if (!isPathWatched) {
      deletedPaths.push(path.id)
      continue
    }

    //File is watched and is the same. just keep as is and skip hashing it later.
    if (path.mTimeMs === watchedFiles[shelfFileIndex].modifiedTimeMS) {
      watchedFiles.splice(shelfFileIndex, 1)
      continue
    }

    //File was modified . Hash it and update DB.
    const newContentHash = await hashFileAsync(path.path)

    await UpdatePath(connection, path.id, {
      mTimeMs: watchedFiles[shelfFileIndex].modifiedTimeMS,
    })

    if (alreadyUpdatedContent.has(path.contentId)) {
      continue
    }

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
    watchedFiles.splice(shelfFileIndex, 1)
  }

  const del = await connection
    .deleteFrom('Paths')
    .where('Paths.id', 'in', deletedPaths)
    .execute()

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
