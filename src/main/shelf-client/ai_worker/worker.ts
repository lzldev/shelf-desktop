import * as os from 'os'
import {AIWorkerDataParser, AiWorkerInvoke, AiWorkerReceive} from './types'

import ts, {Tensor3D} from '@tensorflow/tfjs-node'
import mnet from '@tensorflow-models/mobilenet'
import {
  isMainThread,
  parentPort,
  threadId,
  workerData as _workerData,
} from 'node:worker_threads'
import {DB} from '../../db/kysely-types'
import {Kysely, SqliteDialect} from 'kysely'
import SQLite from 'better-sqlite3'
import {AsyncBatchQueue} from '../../utils/AsyncQueue'
import {createWorkerLogger} from '../../utils/Loggers'
import sharp from 'sharp'
import {handleWorkerMessage} from '../../utils/Worker'

import {z} from 'zod'
import {__DBFILENAME} from '../../db/ShelfKyselyDB'
import {CreateTagContent} from '../../db/TagContentControllers'

const wd = AIWorkerDataParser.safeParse(_workerData)
let workerData: z.infer<typeof AIWorkerDataParser>

if (wd.success) {
  workerData = wd.data
} else if (import.meta.env.VITEST) {
  workerData = {
    dbPath: './examples/',
  }
} else {
  throw wd.error
}

if (isMainThread) {
  throw new Error('Worker called in main thread')
} else if (!parentPort) {
  throw new Error('Worker Parent port missing')
}

const port = parentPort!

const WORKER_LOGGER = createWorkerLogger(threadId)

sharp.cache(false)

const createDbPath = (dbPath: string) => `${dbPath}/${__DBFILENAME}`
const createShelfKyselyDB = (dbPath: string) => {
  return new Kysely<DB>({
    log(event) {
      switch (event.level) {
        case 'error':
          WORKER_LOGGER.error(`QUERY: ${event.query}\n${event.error}`)
          break
      }
    },
    dialect: new SqliteDialect({
      database: new SQLite(createDbPath(dbPath)),
    }),
  })
}

WORKER_LOGGER.info(`META URL |${import.meta.url}|`)
WORKER_LOGGER.info(`10% RAM: ${os.totalmem() / 1024} MB`)

async function main() {
  ts.enableProdMode()
  await ts.ready()

  const model = await mnet.load({version: 2, alpha: 1.0}).catch(() => {
    throw new Error("Couldn't load MOBILENET model")
  })

  WORKER_LOGGER.info(`AI MODULES LOADED ... starting DB`)
  WORKER_LOGGER.info(` on Path ${workerData.dbPath}`)

  const db = createShelfKyselyDB(workerData.dbPath)
  WORKER_LOGGER.info('DB Started')

  const TagToIDMap = new Map<string, number>()

  const workerState: {
    tagToIdMap: Map<string, number>
    colorIds: Array<number>
  } = {
    tagToIdMap: new Map(),
    colorIds: [],
  }

  const updateTags = async () => {
    workerState.tagToIdMap = new Map()
    const tags = await db.selectFrom('Tags').select(['id', 'name']).execute()
    for (const tag of tags) {
      WORKER_LOGGER.info(`OLD Tag : [${tag.id}]${tag.name}`)
      workerState.tagToIdMap.set(tag.name!, tag.id)
    }
  }
  const updateColors = async () => {
    workerState.colorIds = (
      await db.selectFrom('TagColors').select(['id']).execute()
    ).map((v) => v.id)
  }

  const updateState = async () => {
    await updateTags()
    await updateColors()
  }

  await updateColors()

  port.postMessage({
    type: 'ready',
    data: null,
  } satisfies AiWorkerReceive)

  const asyncQueue = new AsyncBatchQueue(5, undefined, async () => {
    WORKER_LOGGER.info('DISPOSING OF TENSORFLOW VARIABLES')
    ts.disposeVariables()
  })

  const onFile = (data: ClassifyInput) => {
    asyncQueue.enqueue(async () => {
      return classifyImage(data).then((res) => {
        port.postMessage({
          type: 'tagged_file',
          data: {
            path: res.path,
          },
        } satisfies AiWorkerReceive)
      })
    })
  }

  handleWorkerMessage<AiWorkerInvoke>(port, {
    new_file: async (message) => {
      onFile(message.data)
    },
    emit_batch: async () => {
      const listener = () => {
        WORKER_LOGGER.info('SENDING BATCH_DONE')

        port.postMessage({
          type: 'batch_done',
          data: true,
        } as AiWorkerReceive)
      }

      if (!asyncQueue.getRunning()) {
        listener()
        return
      }

      asyncQueue.onClearOnce(listener)
    },
    update_state: async () => {
      await updateState()
    },
  })

  type ClassifyInput = Extract<AiWorkerInvoke, {type: 'new_file'}>['data']

  async function classifyImage(classifyData: ClassifyInput) {
    WORKER_LOGGER.info(
      `STARTING CLASSIFICATION OF ${classifyData.path} contentID: ${classifyData.id}`,
    )

    const image = await sharp(classifyData.path!).toBuffer()

    let tensor
    try {
      tensor = ts.node.decodeImage(image, 3, undefined, false) as Tensor3D
    } catch (e) {
      WORKER_LOGGER.error(`Couldn't load ${classifyData.path} into Tensor`)
      throw e
    }

    const classify = await model.classify(tensor, 1).catch((e) => {
      throw e
    })

    tensor.dispose()

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
            colorId:
              workerState.colorIds[
                Math.floor(Math.random() * workerState.colorIds.length)
              ],
          })
          .returning(['id', 'name'])
          .execute()
          .catch((e) => {
            WORKER_LOGGER.error(JSON.stringify(e))
            throw e
          })

        id = newTag![0].id
        TagToIDMap.set(normalized, id)
      }

      await CreateTagContent(db, {
        tagId: id,
        contentId: classifyData.id,
      })

      WORKER_LOGGER.info(
        `TAG ${normalized} | Confidence : ${classification.probability}`,
      )
    }

    WORKER_LOGGER.info(`Finished`)

    return {classification: classify, path: classifyData.path}
  }
}

main().catch((e) => {
  WORKER_LOGGER.error('ERROR ON MAIN')

  throw e
})
