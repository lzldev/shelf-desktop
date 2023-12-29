import {defaultTagNames, defaultTags} from '../utils/DefaultValues'

import type {InsertObject} from 'kysely'
import type {ShelfDBConnection} from './ShelfControllers'
import type {DB} from './kysely-types'

export function CreateTags(
  connection: ShelfDBConnection,
  values: InsertObject<DB, 'Tags'>[],
) {
  return connection.insertInto('Tags').values(values).execute()
}

export async function CreateDefaultTags(connection: ShelfDBConnection) {
  return (
    await connection
      .insertInto('Tags')
      .values(defaultTags)
      .returning(['id', 'name'])
      .execute()
  ).reduce((pv, value) => {
    pv[value.name as defaultTagNames] = value.id
    return pv
  }, {} as Record<defaultTagNames, number>)
}

export async function getDefaultTags(connection: ShelfDBConnection) {
  return (
    await connection
      .selectFrom('Tags')
      .select(['id', 'name'])
      .where('Tags.name', 'in', defaultTagNames)
      .execute()
  ).reduce((pv, value) => {
    pv[value.name as defaultTagNames] = value.id
    return pv
  }, {} as Record<defaultTagNames, number>)
}

export function DeleteTagsFromIds(
  connection: ShelfDBConnection,
  tagIds: number[],
) {
  return connection.deleteFrom('Tags').where('id', 'in', tagIds).execute()
}
