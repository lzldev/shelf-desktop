import { type InsertObject, Kysely, ExpressionBuilder} from 'kysely'
import type {
  ContentTags,
  Contents,
  DB,
  Tags,
} from './kysely-types'
import {jsonArrayFrom} from 'kysely/helpers/sqlite'
import {Nullable} from 'kysely/dist/cjs/util/type-utils'
import { Pagination, ShelfDBInstance } from './ShelfControllers'
import { InsertObjectOrList } from 'kysely/dist/cjs/parser/insert-values-parser'

function CreateContent(connection: ShelfDBInstance, values: InsertObjectOrList<DB, "Contents">) {
  return connection.insertInto('Contents').values(values).executeTakeFirst()
}

//REMOVEME: I Think create content(^) is Already enough
function CreateManyContent(
  connection: ShelfDBInstance,
  values: InsertObjectOrList<DB, "Contents">
) {
  return connection.insertInto('Contents').values(values).execute()
}

function UpdateContentWhereId(connection: ShelfDBInstance, id: number) {
  return connection
    .updateTable('Contents')
    .where('id', '=', id)
    .executeTakeFirst()
}

async function ListContent(
  connection: ShelfDBInstance,
  pagination: Pagination,
): Promise<{
  nextCursor: {offset: number; limit: number} | undefined
  content: {
    id: number
    hash: string
    extension: string
    createdAt: string
    tags: {id: number}[]
  }[]
}> {
  const count = await connection
    .selectFrom('Contents')
    .select((eb) => eb.fn.count<number>('id').as('count'))
    .executeTakeFirst()

  if (!count) {
    return {
      content: [],
      nextCursor: undefined,
    }
  }

  const results = await connection
    .selectFrom('Contents')
    .innerJoin('Paths','Contents.id','Paths.contentId')
    .leftJoin('ContentTags','Contents.id', 'ContentTags.contentId')
    .select((eb) => [
      'Contents.id',
      'Contents.hash',
      'Contents.extension',
      'Contents.createdAt',
      'Paths.path',
      withTagsId(eb),
    ])
    // .where((eb) => eb.or([eb('Paths.path','like','%Some%')]))
    .where('ContentTags.tagId','=',1)
    .limit(pagination.limit)
    .offset(pagination.offset)
    .orderBy('Contents.id','asc')
    .groupBy('Paths.contentId')
    .execute()

  const nextCursor =
    count.count - (pagination.offset + results.length) > 0
      ? {
          offset: pagination.offset + results.length,
          limit: pagination.limit,
        }
      : undefined

  return {
    nextCursor,
    content: results,
  }
}


function withTagsId(
  eb: ExpressionBuilder<
    {
      Tags: Tags
      Contents: Contents
      ContentTags: Nullable<ContentTags>
    },
    'Contents' | 'ContentTags'
  >,
) {
  return jsonArrayFrom(
    eb
      .selectFrom('Tags')
      .select('Tags.id')
      .whereRef('ContentTags.tagId', '=', 'Tags.id'),
  ).as('tags')
}


export {
  CreateContent,
  CreateManyContent,
  UpdateContentWhereId,
  ListContent,
}
