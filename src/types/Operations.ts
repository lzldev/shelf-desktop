import {Prettify} from './utils'
import type {DB} from 'src/main/db/kysely-types'
import type {InsertObject} from 'kysely/dist/cjs/parser/insert-values-parser'
import type {ExtractTypeFromValueExpression} from 'kysely/dist/cjs/parser/value-parser'

type ParseKysely<T> = {
  [key in keyof T]: ExtractTypeFromValueExpression<T[key]>
}

type ColorValues = ParseKysely<
  Pick<InsertObject<DB, 'TagColors'>, 'color' | 'name'>
>

type TagValues = ParseKysely<Pick<InsertObject<DB, 'Tags'>, 'name' | 'colorId'>>

export type ColorOperation =
  | ({
      operation: 'CREATE'
    } & ColorValues)
  | ({
      operation: 'UPDATE'
      id: number
    } & Partial<ColorValues>)
  | {operation: 'DELETE'; id: number}

export type CreateColorOP = Prettify<
  Extract<ColorOperation, {operation: 'CREATE'}>
>
export type UpdateColorOP = Prettify<
  Extract<ColorOperation, {operation: 'UPDATE'}>
>
export type DeleteColorOP = Prettify<
  Extract<ColorOperation, {operation: 'DELETE'}>
>

export type TagOperation =
  | ({
      operation: 'CREATE'
      colorId: number
    } & TagValues)
  | ({
      operation: 'UPDATE'
      id: number
      colorId: number
    } & TagValues)
  | {operation: 'DELETE'; id: number}

export type CREATETagOP = Prettify<Extract<TagOperation, {operation: 'CREATE'}>>
export type UpdateTagOP = Prettify<Extract<TagOperation, {operation: 'UPDATE'}>>
export type DeleteTagOP = Prettify<Extract<TagOperation, {operation: 'DELETE'}>>

export type batchTagging = {
  operation: 'ADD' | 'REMOVE'
  tagIds: number[]
  contentIds: number[]
}
