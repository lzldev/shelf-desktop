import * as chokidar from 'chokidar'
import { createTaggerDB, TaggerDBModels } from '../db/TaggerDB'
import { addTaggerEvents } from './chokiFunctions'
import { FSWatcher } from 'chokidar'
import { IpcMainEvents } from '../../../preload/ipcTypes'
import { Tag } from '../db/models'

/* 
    TODO:
        Checking FS Stat before actually hashing files 
        then comparing to last watched Files (that contains FS.stats)
        To clear dead Paths and get modifications
        
    TODO: Implement
        process.on('SIGINT', saveWatchedFiles)
        process.on('exit', saveWatchedFiles)
        function saveWatchedFiles(){}
*/

class TaggerClient {
    private _choki: FSWatcher
    private _TaggerDB: TaggerDBModels
    private _ready = false

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

    static async create(path: string[] | string, mainCallback: () => void) {
        const TaggerDB = await createTaggerDB(
            Array.isArray(path) ? path[0] : path,
        )

        const choki = chokidar.watch(path, {
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
        })
    }

    protected constructor(newInstance: {
        choki: FSWatcher
        TaggerDB: TaggerDBModels
        mainCallback: () => void
    }) {
        this._TaggerDB = newInstance.TaggerDB
        this._choki = newInstance.choki

        addTaggerEvents(this, newInstance.mainCallback)

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
        const { Content, Path } = this._TaggerDB

        const TagIdArray =
            options?.tags && options?.tags?.length !== 0
                ? options.tags.map((tag) => tag.id)
                : undefined

        const offset = options?.pagination
            ? options.pagination.pageSize * options.pagination.pageSize
            : undefined

        const limit = options?.pagination?.pageSize || undefined

        const result = await Content.findAll({
            attributes: ['id', 'extension'],
            include: [
                { model: Path },
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
            offset: offset,
            limit: limit,
        })

        return result
    }

    async getTags() {
        if (!this._ready) {
            throw "Client isn't ready yet"
        }

        const { Tag } = this._TaggerDB

        const result = await Tag.findAll({
            attributes: ['id', 'name'],
        })

        return result
    }
}

export { TaggerClient }
