import {InsertObject} from 'kysely'

import {ShelfDBConnection} from './ShelfControllers'
import {DB} from './kysely-types'

export function CreateTagColors(
  connection: ShelfDBConnection,
  values: InsertObject<DB, 'TagColors'>[],
) {
  return connection.insertInto('TagColors').values(values).execute()
}

export function DeleteColorsFromIds(connection: ShelfDBConnection, colorIds: number[]) {
  return connection.deleteFrom('TagColors').where('id', 'in', colorIds).execute()
}
 
