import * as os from 'os'
import {AiWorkerInvoke, AiWorkerReceive} from './types'
import ts, {Tensor3D} from '@tensorflow/tfjs-node'
import mnet from '@tensorflow-models/mobilenet'
import {
  isMainThread,
  parentPort as pp,
  threadId,
  workerData as _workerData,
} from 'node:worker_threads'
import {DB} from '../../db/kysely-types'
import SQLite from 'better-sqlite3'
import {Kysely, SqliteDialect} from 'kysely'
import {AsyncQueue} from './AsyncQueue'
import {createWorkerLogger} from '../../utils/Loggers'
import sharp from 'sharp'
import z from 'zod'

const AIWorkerDataParser = z.object({
  dbPath: z.string({
    description: 'Path of SHELFDB',
  }),
})

const workerData = AIWorkerDataParser.parse(_workerData)
if (isMainThread) {
  throw new Error('Worker called in main thread')
} else if (!pp) {
  throw new Error('Worker Parent port missing')
}

const WORKER_LOGGER = createWorkerLogger(threadId)
export const __DBEXTENSION = '.shelf'
export const __DBFILENAME = `.shelfdb${__DBEXTENSION}`
const createDbPath = (dbPath: string) => `${dbPath}/${__DBFILENAME}`
const createShelfKyselyDB = (dbPath: string) => {
  return new Kysely<DB>({
    log: ['query'],
    dialect: new SqliteDialect({
      database: new SQLite(createDbPath(dbPath)),
    }),
  })
}

WORKER_LOGGER.info(`META URL |${import.meta.url}|`)
WORKER_LOGGER.info(`10% RAM: ${os.totalmem() / 1024} MB`)

async function main() {
  await ts.ready()
  const model = await mnet.load({version: 2, alpha: 1.0}).catch(() => {
    throw new Error("Couldn't load MOBILENET model")
  })

  WORKER_LOGGER.info(`AI MODULES LOADED ... starting DB`)
  WORKER_LOGGER.info(` on Path ${workerData.dbPath}`)

  const db = createShelfKyselyDB(workerData.dbPath)
  WORKER_LOGGER.info('DB Started')
  const TagToIDMap = new Map<string, number>()

  const tags = await db.selectFrom('Tags').select(['id', 'name']).execute()
  for (const tag of tags) {
    WORKER_LOGGER.info(`OLD Tag : [${tag.id}]${tag.name}`)
    TagToIDMap.set(tag.name!, tag.id)
  }

  pp!.postMessage({
    type: 'ready',
    data: undefined,
  } satisfies AiWorkerReceive)

  const asyncQueue = new AsyncQueue(5) //TODO: MAKE THIS BIGGER FOR PERFORMANCE

  pp!.on('message', async (value) => {
    const message = value as AiWorkerInvoke

    switch (message.type) {
      case 'new_file': {
        asyncQueue.enqueue(() =>
          classifyImage(message.data).then(() => {
            pp!.postMessage({type: 'new_file', data: {}} as AiWorkerInvoke)
          }),
        )
        break
      }
      case 'emit_batch': {
        const listener = () => {
          WORKER_LOGGER.info('SENDING BATCH_DONE')

          pp!.postMessage({
            type: 'batch_done',
            data: true,
          } as AiWorkerReceive)
        }

        if (!asyncQueue.getRunning()) {
          listener()
          return
        }
        asyncQueue.onClearOnce(listener)
        break
      }
      case 'start': {
        break
      }
    }
  })

  async function classifyImage(
    classifyData: Extract<AiWorkerInvoke, {type: 'new_file'}>['data'],
  ) {
    WORKER_LOGGER.info(`STARTING CLASSIFICATION OFF ${classifyData.path}`)

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

      const mappedTagId = TagToIDMap.get(normalized)

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
        TagToIDMap.set(normalized, id)
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

    pp!.postMessage({
      type: 'tagged_file',
      data: {
        path: classifyData.path,
      },
    } as AiWorkerReceive)

    return classify
  }
}
main().catch(() => {})
