import {InsertObject} from 'kysely'
import {ShelfDBConnection} from './ShelfControllers'
import {DB} from './kysely-types'
import {defaultTags} from '../utils/DefaultValues'

export function CreateTags(
  connection: ShelfDBConnection,
  values: InsertObject<DB, 'Tags'>[],
) {
  return connection.insertInto('Tags').values(values).execute()
}

export async function CreateDefaultTags(connection: ShelfDBConnection) {
  return CreateTags(connection, defaultTags)
}

export function DeleteTagsFromIds(
  connection: ShelfDBConnection,
  tagIds: number[],
) {
  return connection.deleteFrom('Tags').where('id', 'in', tagIds).execute()
}
