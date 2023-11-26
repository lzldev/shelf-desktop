import {DefaultInsertValueNode} from 'kysely'
import {ShelfDBConnection} from './ShelfControllers'
import {InsertObjectOrList} from 'kysely/dist/cjs/parser/insert-values-parser'
import {DB} from './kysely-types'

export function CreateTagContent(
  connection: ShelfDBConnection,
  values: InsertObjectOrList<DB, 'ContentTags'>,
) {
  return connection.insertInto('ContentTags').values(values).executeTakeFirst()
}
