import {InsertObject} from 'kysely'
import {ShelfDBConnection} from './ShelfControllers'
import {DB} from './kysely-types'

export function CreateTags(
  connection: ShelfDBConnection,
  values: InsertObject<DB, 'Tags'>[],
) {
  return connection.insertInto('Tags').values(values).execute()
}

export function DeleteTagsFromIds(connection: ShelfDBConnection, tagIds: number[]) {
  return connection.deleteFrom('Tags').where('id', 'in', tagIds).execute()
}
