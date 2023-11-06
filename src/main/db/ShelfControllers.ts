import { Kysely} from 'kysely'
import type {
  DB,
} from './kysely-types'

export type ShelfDBInstance = Kysely<DB>

//TODO: RENAME TO CONTROLLER TYPES
//TODO: Check if kysely has this already.
export type Pagination = {offset: number; limit: number}
