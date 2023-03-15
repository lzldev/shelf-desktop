import {z, ZodTypeAny} from 'zod'
import * as nodePath from 'path'
import * as fs from 'fs'

export class zJson<
  TSchema extends {[key: string]: ZodTypeAny},
  TRaw extends {[key in keyof TSchema]: z.infer<TSchema[key]>},
> {
  readonly _schema: TSchema
  private _defaults: TRaw
  private _filePath: string
  readonly _isNew: boolean
  private _values: TRaw

  constructor(
    path: string,
    parser: TSchema,
    defaults: TRaw,
    options = {load: true, save: true},
  ) {
    try {
      nodePath.parse(path)
      this._isNew = !fs.existsSync(path)
    } catch (err) {
      throw 'Invalid Directory'
    }
    this._filePath = path
    this._schema = parser
    this._defaults = defaults
    this._values = defaults

    if (!this._isNew && options.load) {
      this.load()
    }

    if (this._isNew && options.save) {
      this.save()
    }
  }

  get(key: keyof TRaw, load = false) {
    if (load) {
      this.load()
    }
    return this._values[key]
  }

  getAll(load = false) {
    if (load) {
      this.load
    }
    return this._values
  }

  set<K extends keyof TSchema>(
    key: K,
    value: z.infer<TSchema[K]>,
    save = false,
  ) {
    let newValue
    try {
      newValue = this._schema[key].parse(value)
    } catch (err) {
      return false
    }

    this._values[key] = newValue

    if (save) {
      return this.safeSave()
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

    const newValues: Partial<TRaw> = {}

    for (const key of Object.keys(this._schema)) {
      newValues[key as keyof TRaw] = this._schema[key]
        .default(this._defaults[key])
        .parse(config[key])
    }

    this._values = newValues as TRaw

    return true
  }

  save(overwrite = false) {
    if (overwrite && fs.existsSync(this._filePath)) {
      fs.rmSync(this._filePath)
    }

    fs.writeFileSync(this._filePath, JSON.stringify(this._values))
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

// export class zFile<
//   TParser extends AnyZodObject,
//   TValue extends z.infer<TParser>,
// > {
//   readonly _parser: TParser
//   private _defaults: TValue
//   private _filePath: string
//   readonly _isNew: boolean
//   private _values: TValue

//   constructor(path: string, parser: TParser, defaults: TValue) {
//     try {
//       nodePath.parse(path)
//       this._isNew = !fs.existsSync(path)
//     } catch (err) {
//       throw 'Invalid Directory'
//     }
//     this._parser = parser
//     this._defaults = defaults
//     this._filePath = path
//     this._values = this.load()
//   }

//   get() {
//     return this._values
//   }

//   set(values: Partial<z.infer<TParser>>, save = false) {
//     const newValues = this._parser.deepPartial().safeParse(values)
//     if (!newValues.success) {
//       return false
//     }
//     const valuesMerge = deepmerge(this._values, newValues.data)
//     this._values = valuesMerge as TValue

//     if (save) {
//       return this.safeSave()
//     }
//     return true
//   }
//   setAndSave(values: Partial<z.infer<TParser>>) {
//     return this.set(values, true)
//   }
//   setAll(values: Required<TValue>) {
//     const newValues = this._parser.parse(values)

//     if (!newValues.success) {
//       // invalid
//       return false
//     }

//     return true
//   }

//   load() {
//     let config
//     try {
//       if (fs.existsSync(this._filePath)) {
//         config = this._parser.parse(
//           JSON.parse(fs.readFileSync(this._filePath).toString()),
//         )
//       } else {
//         config = this._defaults
//       }
//     } catch (err) {
//       throw 'Could not parse/read Config File.'
//     }
//     return config as TValue
//   }

//   save(overwrite = false) {
//     if (overwrite && fs.existsSync(this._filePath)) {
//       fs.rmSync(this._filePath)
//     }

//     fs.writeFileSync(this._filePath, JSON.stringify(this._values))
//   }

//   safeSave() {
//     try {
//       this.save()
//     } catch (e) {
//       return false
//     }
//     return true
//   }
// }
