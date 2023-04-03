import {z, ZodTypeAny} from 'zod'
import * as nodePath from 'path'
import * as fs from 'fs'

export type zJsonSchema = {[key: string]: ZodTypeAny}
export type zJsonValues<T extends zJsonSchema> = {
  [key in keyof T]: z.infer<T[key]>
}

export type zJsonSchemaInfer<T extends zJsonSchema> = {
  [key in keyof T]: z.infer<T[key]>
}

export class zJson<
  TSchema extends {[key: string]: ZodTypeAny},
  TValues extends zJsonSchemaInfer<TSchema>,
> {
  readonly _schema: TSchema
  private _defaults: TValues
  private _filePath: string
  readonly isNew: boolean
  private _values: TValues

  constructor(
    path: string,
    parser: TSchema,
    defaults: TValues,
    options = {load: true, save: true},
  ) {
    try {
      nodePath.parse(path)
      this.isNew = !fs.existsSync(path)
    } catch (err) {
      throw 'Invalid Directory'
    }
    this._filePath = path
    this._schema = parser
    this._defaults = defaults
    this._values = defaults
    this._values as zJsonSchemaInfer<TSchema>

    if (!this.isNew && options.load) {
      this.load()
    }

    if (this.isNew && options.save) {
      this.save()
    }
  }

  get<K extends keyof zJsonSchemaInfer<TSchema>>(key: K, load = false) {
    if (load) {
      this.load()
    }
    return this._values[key] as zJsonSchemaInfer<TSchema>[K]
  }

  getAll(load = false) {
    if (load) {
      this.load
    }
    return this._values as zJsonSchemaInfer<TSchema>
  }

  setAll(newValue: zJsonSchemaInfer<TSchema>, save = true) {
    this._values = newValue as TValues

    if (save) {
      return this.save()
    }
    return true
  }

  set<K extends keyof TSchema>(
    key: K,
    value: z.infer<TSchema[K]>,
    save = true,
  ) {
    let newValue
    try {
      newValue = this._schema[key].parse(value)
    } catch (err) {
      return false
    }

    this._values[key] = newValue

    if (save) {
      return this.save()
    }
    return true
  }

  load() {
    if (!fs.existsSync(this._filePath)) {
      return false
    }
    let config
    try {
      config = JSON.parse(fs.readFileSync(this._filePath).toString())
    } catch (err) {
      return false
    }

    const newValues: Partial<TValues> = {}

    for (const key of Object.keys(this._schema)) {
      newValues[key as keyof TValues] = this._schema[key]
        .default(this._defaults[key])
        .parse(config[key])
    }

    this._values = newValues as TValues

    return true
  }

  save(overwrite = false) {
    try {
      if (overwrite && fs.existsSync(this._filePath)) {
        fs.rmSync(this._filePath)
      }

      fs.writeFileSync(this._filePath, JSON.stringify(this._values))
    } catch (err) {
      return false
    }
    return true
  }

  safeSave() {
    try {
      this.save()
    } catch (e) {
      return false
    }
    return true
  }
}
