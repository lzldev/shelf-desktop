import {TagCreationFields} from '../main/src/db/models/Tag'
import {TagColorCreationFields} from '../main/src/db/models/TagColor'
import {Prettify} from './utils'

export type ColorOperation =
  | ({
      operation: 'CREATE'
    } & TagColorCreationFields)
  | ({
      operation: 'UPDATE'
      id: number
    } & TagColorCreationFields)
  | {operation: 'DELETE'; id: number}

export type CREATEColorOP = Prettify<
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
    } & TagCreationFields)
  | ({
      operation: 'UPDATE'
      id: number
    } & TagCreationFields)
  | {operation: 'DELETE'; id: number}

export type CREATETagOP = Prettify<
  Extract<ColorOperation, {operation: 'CREATE'}>
>
export type UpdateTagOP = Prettify<
  Extract<ColorOperation, {operation: 'UPDATE'}>
>
export type DeleteTagOP = Prettify<
  Extract<ColorOperation, {operation: 'DELETE'}>
>
