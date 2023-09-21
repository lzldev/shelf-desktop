import {Stats, createReadStream, statSync} from 'fs'
import {parse} from 'path'
import {createHash} from 'crypto'
import {flattenDirectoryTree} from '../utils/chokiUtils'
import {updateProgress as sendUpdateProgressEvent} from '../..'
import {ShelfClient} from './ShelfClient'
import {mockTags} from '../utils/mockTags'
import {Content, Path, Tag, TagColor} from '../db/models'
import {toFileTuple} from '../utils/chokiUtils'
import {normalize} from 'path'
import {defaultColors} from '../utils/defaultColors'
import {dialog} from 'electron'
// import {dialog} from 'electron/main'
import {readdir} from 'fs/promises'
import {checkFormat} from '../../../renderer/src/utils/formats'
import {SHELF_LOGGER} from '../utils/Loggers'
import {WaitForWorkerEvent} from './ai_worker/WorkerUtils'

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

  choki.on('unlink', shelfOnUnlink)
  choki.on('add', shelfOnAdd)
  choki.on('change', shelfOnChange)
  choki.on('ready', shelfOnReady)
  choki.on('error', shelfOnError)
  choki.on('addDir', shelfOnAddDir)

  async function shelfOnAddDir(path: string, stats: Stats) {
    const files = (await readdir(path)).length

    if (
      files >= 200 &&
      ConfirmationDialog(
        path + '\nFiles' + files + 'dirs:' + (stats.nlink - 2),
      ) === 0
    ) {
      const prev = shelfClient.config.get('ignoredPaths')
      shelfClient.config.set('ignoredPaths', [...prev, path], false)

      choki.unwatch(path)
    }
  }

  async function shelfOnError(error: Error) {
    if (!('path' in error)) {
      return
    }

    const prev = shelfClient.config.get('ignoredPaths', false)
    const path = error.path as string

    shelfClient.config.set('ignoredPaths', [...prev, path], false)
    choki.unwatch(path)
    error.path
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
      dialog.showErrorBox('Error', JSON.stringify(e))
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

      //FIXME : Create a separate check for the AI thing
      if (
        checkFormat(content.extension) === 'image' &&
        content.extension !== '.webp'
      ) {
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

  const createProgressUpdater = <TParts extends Record<string, number>>(
    parts: TParts,
  ) => {
    const idx_key_map: Record<keyof TParts, number> = {} as Record<
      keyof TParts,
      number
    >

    const progress = Object.entries(parts).map(([key, _], i) => {
      idx_key_map[key as keyof TParts] = i
      return 0
    })
    const last_messages: string[] = []
    let last_progress = 0

    const sendProgress = (
      key: keyof TParts,
      completion: number,
      message: string,
    ) => {
      progress[idx_key_map[key]] = completion / parts[key]
      sendUpdateProgress(message)
    }

    const addToKey = (key: keyof TParts, message: string) => {
      progress[idx_key_map[key]] =
        (progress[idx_key_map[key]] * parts[key] + 1) / parts[key]
      sendUpdateProgress(message)
    }

    const sendUpdateProgress = (new_message: string) => {
      const parts_from_thing = 100 / progress.length
      let total_progress = 0

      progress.forEach((v) => {
        total_progress += parts_from_thing * v
      })

      total_progress = Math.round(total_progress) / 100

      if (total_progress !== last_progress) {
        last_progress = total_progress

        if (last_messages.length <= 2) {
          last_messages.shift()
        }

        last_messages.push(new_message)

        sendUpdateProgressEvent({
          total: total_progress,
          messages: last_messages,
        })
      }
    }

    return {sendProgress, addToKey}
  }
  async function shelfOnReady() {
    shelfClient.config.save()

    // const ContentsTransaction = await sequelize.transaction()
    const INITHASHES = new Map<string, number>()
    const INITPATHS = new Map<string, number>()
    const newFiles = toFileTuple(
      flattenDirectoryTree(choki.getWatched()).filter(
        (p) => !statSync(p).isDirectory(),
      ),
    )
    const ui_parts = {
      AI: newFiles.length,
      SHELF: newFiles.length,
    } as {
      AI: number
      SHELF: number
    }

    const {sendProgress, addToKey} = createProgressUpdater(ui_parts)

    shelfClient.AIWorker.on('message', (message) => {
      if (message.type !== 'tagged_file') {
        return
      }

      addToKey('AI', '[AI] File Tagged...')
    })

    //DB Already Initialized
    if (!shelfClient.config.isNew) {
      // const pathTransaction = await sequelize.transaction()

      //Cleaning up loose paths
      console.time('DB CLEANUP ->')
      const paths = await Path.findAll({
        attributes: {
          exclude: ['updatedAt', 'createdAt'],
        },
        // transaction: pathTransaction,
      })

      for (const dbPath of paths) {
        const path = dbPath.toJSON()
        const foundPath = newFiles.findIndex((nf) => {
          return nf[0] === path.path
        })

        if (foundPath === -1) {
          //TODO: REMOVE LOG
          console.log('CLEANING >', path.path)
          await dbPath.destroy({
            // transaction: pathTransaction
          })
          continue
        }

        if (foundPath !== -1 && path.mTimeMs === newFiles[foundPath][1]) {
          newFiles.splice(foundPath, 1)
          continue
        }

        if (path.mTimeMs !== newFiles[foundPath][1]) {
          const newHash = await hashFileAsync(path.path)

          const content = await Content.findOne({
            where: {
              id: path.contentId,
            },
            // transaction: pathTransaction,
          })

          await content?.update(
            {
              hash: newHash,
            },
            {
              // transaction: pathTransaction,
            },
          )

          await dbPath.update(
            {
              mTimeMs: newFiles[foundPath][1],
            },
            {
              // transaction: pathTransaction,
            },
          )
          continue
        }
      }

      // await pathTransaction.commit()
      console.timeEnd('DB CLEANUP ->')
    } else {
      //Initalizing the DB -----------------------------------------
      //Initializing Tag Colors
      const tagTimerName = '\x1b[44m\x1b[37m[TAGCOLOR]\x1b[0m [BULKCREATE]'

      console.time(tagTimerName)
      await TagColor.bulkCreate(defaultColors)
      console.timeEnd(tagTimerName)

      //REMOVEME : MOCK TAGS ---------------------------------------
      // const tagTransaction = await sequelize.transaction()
      const mockTagTimerName =
        '\x1b[44m\x1b[37m[MOCK_TAGS]\x1b[0m [TRANSACTIOn]'

      console.time(mockTagTimerName)
      for (const tag of mockTags) {
        const randomColor = (await TagColor.findOne({
          order: sequelize.random(),
          // transaction: tagTransaction,
        }))!

        await Tag.findOrCreate({
          where: {
            name: tag.name,
          },
          defaults: {
            name: tag.name,
            colorId: randomColor.id,
          },
          // transaction: tagTransaction,
        })
      }

      // await tagTransaction.commit()
      console.timeEnd(mockTagTimerName)
    }
    //------------------------------------------------------------

    console.time('DB ->')

    for (let i = 0; i < newFiles.length; i++) {
      const [filePath, mTimeMs] = newFiles[i]
      const fileHash = await hashFileAsync(filePath)
      const tempContentID = INITHASHES.get(fileHash)

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
        const content = await Content.create(
          {
            hash: fileHash,
            extension: parse(filePath).ext,
            paths: [
              {
                path: filePath,
                mTimeMs: mTimeMs,
              },
            ] as Path[],
          },
          {
            include: [Path, Tag],
            // transaction: ContentsTransaction,
          },
        )

        //FIXME : Create a separate check for the AI thing
        if (
          checkFormat(content.extension) === 'image' &&
          content.extension !== '.webp'
        ) {
          shelfClient.AIWorker.postMessage({
            type: 'new_file',
            data: {
              id: content.id,
              path: filePath,
            },
          })
        } else {
          ui_parts.SHELF--
        }

        //REMOVEME: MOCK
        // await content.$add('tag', Math.round(Math.random() * mockTags.length), {
        //   transaction: ContentsTransaction,
        // })
        //----

        INITHASHES.set(fileHash, content.id)
        INITPATHS.set(filePath, content.paths![0].id)
        // INITPATHS.set(filePath, newPath.id)
        continue
      }

      //TODO: I think this should be !tempContentID
      if (tempContentID && foundContent !== null) {
        INITHASHES.set(fileHash, foundContent.id)
      }

      //Content is found but path isn't
      if (foundPath === null && !INITPATHS.get(filePath)) {
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
    /*
     * FIXME:
     * This Will crash the app since the Worker
     * can register before the Transaction being commited
     * removed the transaction from the content part ...
     *  the work wont crash the app now
     */
    console.timeEnd('DB ->')
    console.time('Waiting...')

    const WaitForAITOWork = async () => {
      return new Promise(async (resolve, reject) => {
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
        }, 60 * 1000)
      })
    }

    await WaitForAITOWork()
      .then(() => {
        SHELF_LOGGER.info('Batch FINISHED')
      })
      .catch(() => {
        SHELF_LOGGER.info('AIWORKER TIMED OUT')
      })

    console.timeEnd('Waiting...')

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
