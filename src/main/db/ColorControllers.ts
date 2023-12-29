import {InsertObject} from 'kysely'

import {ShelfDBConnection} from './ShelfControllers'
import {DB} from './kysely-types'
import {defaultColors} from '../utils/DefaultValues'

export function CreateTagColors(
  connection: ShelfDBConnection,
  values: InsertObject<DB, 'TagColors'>[],
) {
  return connection.insertInto('TagColors').values(values).execute()
}

export function CreateDefaultColors(connection: ShelfDBConnection) {
  return CreateTagColors(connection, defaultColors)
}

export function DeleteColorsFromIds(
  connection: ShelfDBConnection,
  colorIds: number[],
) {
  return connection
    .deleteFrom('TagColors')
    .where('id', 'in', colorIds)
    .execute()
}
