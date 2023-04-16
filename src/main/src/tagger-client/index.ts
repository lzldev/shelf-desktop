import * as chokidar from 'chokidar'
import {createTaggerDB, TaggerDBModels} from '../db/TaggerDB'
import {addChokiEvents} from './chokiEvents'
import {FSWatcher} from 'chokidar'
import {IpcMainEvents} from '../../../preload/ipcMainTypes'
import {Content, ContentTag, Path, Tag, TagColor} from '../db/models'
import {z} from 'zod'
import {zJson, zJsonValues} from '../zJson'
import {join} from 'path'
import {Op} from 'sequelize'
import {IpcRendererEvents} from '../../../preload/ipcRendererTypes'
import {sendEventToAllWindows} from '../..'

const CONFIG_FILE_NAME = '/.taggercfg' //TODO: Move this elsewhere

const configSchema = {
  additionalPaths: z.array(z.string()),
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
    const config = new zJson(join(basePath + CONFIG_FILE_NAME), configSchema, {
      additionalPaths: [],
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
  private static isReadyCheck(
    _target: any,
    __: any,
    descriptor: TypedPropertyDescriptor<any>,
  ) {
    const original = descriptor.value

    descriptor.value = function (...args: any[]) {
      //@ts-ignore TypedPropertyDescriptor is wrong
      if (!this._ready) {
        throw "Client isn't ready yet"
      }
      return original.call(this, ...args)
    }

    return descriptor
  }
  private static SendEventAfter(event: keyof IpcRendererEvents) {
    return (
      _target: any,
      __: any,
      descriptor: TypedPropertyDescriptor<any>,
    ) => {
      const original = descriptor.value

      descriptor.value = function (...args: any[]) {
        //@ts-ignore TypedPropertyDescriptor is wrong
        if (!this._ready) {
          throw "Client isn't ready yet"
        }
        const originalReturn = original.call(this, ...args)
        sendEventToAllWindows(event)
        return originalReturn
      }

      return descriptor
    }
  }

  @TaggerClient.isReadyCheck
  getWatchedFiles() {
    return this._choki.getWatched()
  }
  @TaggerClient.isReadyCheck
  async getContent(options: IpcMainEvents['getTaggerImages']['args']) {
    const order = options?.order ? [options?.order] : undefined

    const TagIdArray =
      options?.tags && options?.tags?.length !== 0
        ? options.tags.map((tag) => tag.id)
        : undefined

    const {offset, limit} = options?.pagination || {}

    const {rows, count} = await Content.findAndCountAll({
      order: order,
      offset: offset,
      limit: limit,
      include: [
        {
          model: Path,
          where: {
            path: {
              [Op.or]: options.paths?.map((p) => {
                return {[Op.like]: `%${p.value}%`}
              }),
            },
          },
        },
        {
          model: Tag,
          attributes: ['id', 'colorId'],
          where: TagIdArray
            ? {
                id: TagIdArray,
              }
            : undefined,
        },
      ],
    })

    let nextCursor
    if (typeof offset === 'number' && typeof limit === 'number') {
      const nextOffset = offset + limit
      const diffToEnd = count - nextOffset

      if (nextOffset < count) {
        nextCursor = {
          offset: nextOffset,
          limit: diffToEnd < limit ? diffToEnd : limit,
        }
      }
    }

    return {content: rows, nextCursor}
  }
  @TaggerClient.isReadyCheck
  async getDetailedContent(options: {id: number}) {
    const result = await Content.findOne({
      where: {
        id: options.id,
      },
      include: [
        {model: Path},
        {
          model: Tag,
          attributes: ['id', 'name', 'colorId'],
        },
      ],
    })

    return result
  }
  @TaggerClient.isReadyCheck
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
  @TaggerClient.isReadyCheck
  async removeTagFromContent(
    options: IpcMainEvents['removeTagfromContent']['args'],
  ) {
    const newRelation = await ContentTag.findOne({
      where: {
        contentId: options.contentId,
        tagId: options.tagId,
      },
    })
    try {
      await newRelation?.destroy()
      return true
    } catch (e) {
      return false
    }
  }

  @TaggerClient.isReadyCheck
  async getTags() {
    const result = await Tag.findAll({
      attributes: ['id', 'name', 'colorId'],
    })
    return result
  }
  @TaggerClient.isReadyCheck
  async getColors() {
    const result = await TagColor.findAll({
      attributes: ['id', 'color', 'name'],
    })
    return result
  }

  @TaggerClient.isReadyCheck
  @TaggerClient.SendEventAfter('updateColors')
  @TaggerClient.SendEventAfter('updateTags')
  async createTag(options: IpcMainEvents['createTag']['args']) {
    //TODO: REFACTOR Look into this
    let colorId
    if ('colorId' in options) {
      colorId = options.colorId
    } else {
      const color = await TagColor.build({
        name: options.newColor.name,
        color: options.newColor.color,
      }).save()

      colorId = color.id
    }

    const tagBuild = Tag.build({
      name: options.name,
      parentOnly: options.parentOnly,
      colorId,
    })

    try {
      return !!(await tagBuild.save())
    } catch (err) {
      return false
    }
  }

  @TaggerClient.isReadyCheck
  @TaggerClient.SendEventAfter('updateColors')
  @TaggerClient.SendEventAfter('updateTags')
  async editColors(operations: IpcMainEvents['editColors']['args'][0]) {
    const editColorsTransaction = await this._TaggerDB.sequelize.transaction()

    for (const op of operations) {
      switch (op.operation) {
        case 'CREATE': {
          //TODO: Check if operation is being Spread here
          await TagColor.build({...op}).save({
            transaction: editColorsTransaction,
          })
          continue
        }
        case 'UPDATE': {
          const {id: toBeUpdatedId, operation, ...values} = op
          await TagColor.update(
            {...values},
            {where: {id: toBeUpdatedId}, transaction: editColorsTransaction},
          )
          continue
        }
        case 'DELETE': {
          await TagColor.destroy({
            where: {
              id: op.id,
            },
            transaction: editColorsTransaction,
          })
          continue
        }
        default:
          throw 'UNEXPECTED OPERATION'
      }
    }

    await editColorsTransaction.commit()
    return true
  }

  @TaggerClient.isReadyCheck
  @TaggerClient.SendEventAfter('updateColors')
  @TaggerClient.SendEventAfter('updateTags')
  async editTags(operations: IpcMainEvents['editTags']['args'][0]) {
    const editTagsTransaction = await this._TaggerDB.sequelize.transaction()

    for (const op of operations) {
      switch (op.operation) {
        case 'CREATE': {
          //TODO: Check if operation is being Spread here
          await Tag.build({...op}).save({
            transaction: editTagsTransaction,
          })
          continue
        }
        case 'UPDATE': {
          const {id: toBeUpdatedId, operation, ...values} = op
          await Tag.update(
            {...values},
            {where: {id: toBeUpdatedId}, transaction: editTagsTransaction},
          )
          continue
        }
        case 'DELETE': {
          await Tag.destroy({
            where: {
              id: op.id,
            },
            transaction: editTagsTransaction,
          })
          continue
        }
        default:
          throw 'UNEXPECTED OPERATION'
      }
    }

    await editTagsTransaction.commit()
    return true
  }
}

export {TaggerClient}
