import * as chokidar from 'chokidar'
import {createTaggerDB, TaggerDBModels} from '../db/TaggerDB'
import {addChokiEvents} from './chokiEvents'
import {FSWatcher} from 'chokidar'
import {FunctionFromEvent, IpcMainEvents} from '../../../preload/ipcTypes'
import {Content, ContentTag, Path, Tag} from '../db/models'
import {z} from 'zod'
import {zJson, zJsonValues} from '../zJson'
import {join} from 'path'

/* 
    TODO: Implement
        process.on('SIGINT', saveWatchedFiles)
        process.on('exit', saveWatchedFiles)
        function saveWatchedFiles(){}
*/

const CONFIG_FILE_NAME = '/.taggercfg' //TODO: Move this elsewhere

const configSchema = {
  additionalPaths: z.array(z.string()),
  lastFiles: z.array(
    z.tuple([
      z.string({
        description: 'Path',
      }),
      z.number({
        description: 'lastModified',
      }),
    ]),
  ),
} as const

type ConfigSchema = typeof configSchema
type ConfigValues = zJsonValues<typeof configSchema>

class TaggerClient {
  private _choki: FSWatcher
  private _TaggerDB: TaggerDBModels
  private _ready = false
  private _config: zJson<ConfigSchema, ConfigValues>

  get config() {
    return this._config
  }
  get models() {
    return this._TaggerDB
  }
  get choki() {
    return this._choki
  }
  get ready() {
    return this._ready
  }
  set ready(value) {
    this._ready = value
  }

  static async create(basePath: string, mainCallback: () => void) {
    const TaggerDB = await createTaggerDB(
      Array.isArray(basePath) ? basePath[0] : basePath,
    )

    console.log('CONFIG ->', join(basePath + CONFIG_FILE_NAME))
    const config = new zJson(join(basePath + CONFIG_FILE_NAME), configSchema, {
      additionalPaths: [],
      lastFiles: [],
    })

    const choki = chokidar.watch([basePath, ...config.get('additionalPaths')], {
      ignoreInitial: true,
      ignored: [
        (str) => {
          return str.includes('.tagger')
        },
      ],
      followSymlinks: false,
    })

    return new TaggerClient({
      choki,
      TaggerDB,
      mainCallback,
      config,
    })
  }

  protected constructor(newInstance: {
    choki: FSWatcher
    TaggerDB: TaggerDBModels
    config: zJson<ConfigSchema, ConfigValues>
    mainCallback: () => void
  }) {
    this._TaggerDB = newInstance.TaggerDB
    this._choki = newInstance.choki
    this._config = newInstance.config

    addChokiEvents(this, newInstance.mainCallback)

    return this
  }

  getWatchedFiles() {
    if (!this._ready) return "Client isn't ready"
    return this._choki.getWatched()
  }

  async getContent(options?: IpcMainEvents['getTaggerImages']['args']) {
    if (!this._ready) {
      throw "Client isn't ready yet"
    }

    const TagIdArray =
      options?.tags && options?.tags?.length !== 0
        ? options.tags.map((tag) => tag.id)
        : undefined

    const offset = options?.pagination
      ? options.pagination.page * options.pagination.pageSize
      : undefined

    const limit = options?.pagination?.pageSize || undefined

    const {rows, count} = await Content.findAndCountAll({
      attributes: ['id', 'extension'],
      offset: offset,
      limit: limit,
      include: [
        {model: Path},
        {
          model: Tag,
          attributes: ['id'],
          where: TagIdArray
            ? {
                id: TagIdArray,
              }
            : undefined,
        },
      ],
    })

    return {content: rows, count: count}
  }

  async getOneContent(options: {id: number}) {
    if (!this._ready) {
      throw "Client isn't ready yet"
    }

    const result = await Content.findOne({
      where: {
        id: options.id,
      },
      include: [
        {model: Path},
        {
          model: Tag,
          attributes: ['id', 'name'],
        },
      ],
    })

    return result
  }

  async getTags() {
    if (!this._ready) {
      throw "Client isn't ready yet"
    }

    const result = await Tag.findAll({
      attributes: ['id', 'name'],
    })

    return result
  }
  async addTagToContent(options: IpcMainEvents['addTagToContent']['args']) {
    const newRelation = await ContentTag.build({
      contentId: options.contentId,
      tagId: options.tagId,
    })
    try {
      await newRelation.save()
      return true
    } catch (e) {
      return false
    }
  }
}

export {TaggerClient}
