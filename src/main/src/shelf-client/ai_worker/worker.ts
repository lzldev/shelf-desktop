import * as os from 'os'
import { AiWorkerInvoke, AiWorkerReceive } from './types'
import ts, { Tensor3D } from '@tensorflow/tfjs-node'
import mnet from '@tensorflow-models/mobilenet'
import {
  isMainThread,
  parentPort as pp,
  threadId,
  workerData as _workerData,
} from 'node:worker_threads'
import { DB } from '../../db/kysely-types'
import SQLite from 'better-sqlite3'
import { Kysely, SqliteDialect } from 'kysely'
import { AsyncQueue } from './AsyncQueue'
import { createWorkerLogger } from '../../utils/Loggers'
import sharp from 'sharp'

type ai_worker_data = {
  path: string
  dbPath: string
}

const workerData = _workerData as ai_worker_data

if (isMainThread) {
  throw new Error('Worker called in main thread')
} else if (!pp) {
  throw new Error('Worker Parent port missing')
} else if (typeof workerData?.path !== 'string') {
  throw new Error('AI Worker Path Missing')
} else if (typeof workerData?.dbPath !== 'string') {
  throw new Error('AI Worker dbPath Missing')
}

const WORKER_LOGGER = createWorkerLogger(threadId)
export const __DBEXTENSION = '.shelf'
export const __DBFILENAME = `.shelfdb${__DBEXTENSION}`
const createDbPath = (dbPath: string) => `${dbPath}/${__DBFILENAME}`
const createShelfKyselyDB = (dbPath: string) => {
  return new Kysely<DB>({
    dialect: new SqliteDialect({
      database: new SQLite(createDbPath(dbPath)),
    }),
  })
}

WORKER_LOGGER.info(`META URL |${import.meta.url}|`)
WORKER_LOGGER.info(`10% RAM: ${os.totalmem() / 10} bytes`)

// console.log('[WORKER] DIR ', resolveBaseUrl('./', false, createLogger()))

async function main() {
  await ts.ready()
  // ts.enableDebugMode() //REMOVEME:DEBUG MODE -------------------------------------------------------------------
  //
  const model = await mnet.load({ version: 2, alpha: 1.0 }).catch((e) => {
    throw new Error("Couldn't load MOBILENET model")
  })

  WORKER_LOGGER.info(`AI MODULES LOADED ... starting DB`)
  WORKER_LOGGER.info(` on Path ${workerData.path}`)

  const db = createShelfKyselyDB(workerData.dbPath)
  WORKER_LOGGER.info('DB Started')
  const tMap = new Map<string, number>()

  await (async () => {
    const tags = await db.selectFrom('Tags').select(['id', 'name']).execute()
    for (const tag of tags) {
      tMap.set(tag.name!, tag.id)
    }
  })()

  const start_message = {
    type: 'ready',
    data: undefined,
  } satisfies AiWorkerReceive

  pp!.postMessage(start_message)

  const asyncQueue = new AsyncQueue(5) //TODO: MAKE THIS BIGGER FOR PERFORMANCE

  pp!.on('message', async (value) => {
    const message = value as AiWorkerInvoke

    switch (message.type) {
      case 'new_file':
        asyncQueue.enqueue(() =>
          classifyImage(message.data).then(() => {
            pp!.postMessage({ type: 'new_file', data: {} } as AiWorkerInvoke)
          }),
        )
        break
      case 'emit_batch':
        asyncQueue.onClearOnce(() => {
          const message = {
            type: 'batch_done',
            data: true,
          } as AiWorkerReceive
          pp!.postMessage(message)
        })
        break
      case 'start':
        break
    }
  })

  // async function initialTagging(
  //   data: Extract<AiWorkerInvoke, {type: 'start'}>['data'],
  // ) {
  //   for (const path of data.files) {
  //     classifyImage(path)
  //   }
  // }

  async function classifyImage(
    classifyData: Extract<AiWorkerInvoke, { type: 'new_file' }>['data'],
  ) {
    WORKER_LOGGER.info(`STARTING CLASSIFICATION OFF ${classifyData.path}`)

    /*
     * Hmm i think a good solution for this is
     *
     * 1 - Try to make this pool bigger ?
     *  at least an option to do so
     *
     * 2-
     * Check the system memory size , then divide it by Pool size
     * for ex, if my AsyncQueue is 5 long ,
     * get 10%ram/5 <- this will be the cap
     * if file exceeds the cap ,
     * resize it with magick
     *
     * */

    const image = await sharp(classifyData.path!).toBuffer()

    let tensor
    try {
      tensor = ts.node.decodeImage(image, 3, undefined, false) as Tensor3D
    } catch (err) {
      WORKER_LOGGER.error(`Couldn't load ${classifyData.path} into Tensor`)
      return
    }

    const classify = await model.classify(tensor, 1).catch((e) => {
      throw e
    })

    for (const classification of classify) {
      const normalized = classification.className
        .split(',')[0]
        .trim()
        .toLowerCase()

      const mappedTagId = tMap.get(normalized)

      let id
      if (mappedTagId) {
        id = mappedTagId
      } else {
        const newTag = await db
          .insertInto('Tags')
          .values({
            name: normalized,
            colorId: 1,
            updatedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          })
          .returning(['id', 'name'])
          .execute()
          .catch((e) => {
            WORKER_LOGGER.error(JSON.stringify(e))
          })

        id = newTag![0].id
      }

      db.insertInto('ContentTags')
        .values({
          tagId: id,
          contentId: classifyData.id as unknown as number,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .execute()

      WORKER_LOGGER.info(
        `TAG ${normalized} | Confidence : ${classification.probability}`,
      )
    }

    WORKER_LOGGER.info(`Finished`)

    return classify
  }
}
main().catch(() => { })
