import { AnyZodObject, z } from 'zod'
import * as path from 'path'
import * as fs from 'fs'
import deepmerge from 'deepmerge'

export class zcfg<
    TParser extends AnyZodObject,
    TValues extends z.infer<TParser>,
> {
    readonly _parser: TParser
    private _defaults: TValues
    private _dir: string
    private _values: TValues

    constructor(dir: string, parser: TParser, defaults: TValues) {
        try {
            path.parse(dir)
        } catch (err) {
            throw 'Invalid Directory'
        }
        this._parser = parser
        this._defaults = defaults
        this._dir = dir
        this._values = this.load()
    }

    get() {
        return this._values
    }

    set(values: Partial<z.infer<TParser>>, save = false) {
        const newValues = this._parser.deepPartial().safeParse(values)

        if (!newValues.success) {
            return false
        }
        const valuesMerge = deepmerge(this._values, newValues.data)
        this._values = valuesMerge as TValues

        if (!save) {
            return true
        }

        return this.save()
    }
    setAndSave(values: Partial<z.infer<TParser>>) {
        return this.set(values, true)
    }
    setAll(values: Required<TValues>) {
        const newValues = this._parser.parse(values)

        if (!newValues.success) {
            // invalid
            return false
        }

        return true
    }

    load(save = false) {
        let config
        try {
            if (fs.existsSync(this._dir)) {
                config = this._parser.parse(
                    JSON.parse(fs.readFileSync(this._dir).toString()),
                )
            } else {
                config = this._defaults
            }
        } catch (err) {
            throw 'Could not parse/read Config File.'
        }
        return config as TValues
    }

    save() {
        let tbsValues
        try {
            tbsValues = this._parser.parse(this._values)
        } catch (_) {
            throw 'Invalid values'
        }
        try {
            fs.writeFileSync(this._dir, JSON.stringify(this._values))
        } catch (_) {
            throw "Couldn't Save Paths"
        }
    }

    safeSave() {
        let tbsValues
        try {
            tbsValues = this._parser.parse(this._values)
            fs.writeFileSync(this._dir, JSON.stringify(this._values))
        } catch (e) {
            return false
        }
        return true
    }
}
