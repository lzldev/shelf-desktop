import { Kysely} from 'kysely'
import type {
  DB,
} from './kysely-types'

export type ShelfDBConnection = Kysely<DB>

export type Pagination = {offset: number; limit: number}
export type Cursor = {offset:number;limit:number} | undefined
