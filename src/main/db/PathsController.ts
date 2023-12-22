import {InsertObject, UpdateObject} from 'kysely'
import {ShelfDBConnection} from './ShelfControllers'
import {DB} from './kysely-types'

export function CreatePaths(
  connection: ShelfDBConnection,
  values: InsertObject<DB, 'Paths'>[],
) {
  return connection.insertInto('Paths').values(values).execute()
}

export function DeletePathsFromIds(
  connection: ShelfDBConnection,
  pathIds: number[],
) {
  return connection.deleteFrom('Paths').where('id', 'in', pathIds).execute()
}

export function UpdatePath(
  connection: ShelfDBConnection,
  id: number,
  values: UpdateObject<DB, 'Paths'>,
) {
  return connection
    .updateTable('Paths')
    .where('Paths.id', '=', id)
    .set(values)
    .executeTakeFirst()
}
