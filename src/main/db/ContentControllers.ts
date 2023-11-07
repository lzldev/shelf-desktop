import {ExpressionBuilder} from 'kysely'
import type {ContentTags, Contents, DB, Tags} from './kysely-types'
import {jsonArrayFrom} from 'kysely/helpers/sqlite'
import {Nullable} from 'kysely/dist/cjs/util/type-utils'
import {Cursor, Pagination, ShelfDBConnection} from './ShelfControllers'
import {
  InsertObject,
  InsertObjectOrList,
} from 'kysely/dist/cjs/parser/insert-values-parser'

function CreateContent(
  connection: ShelfDBConnection,
  values: InsertObjectOrList<DB, 'Contents'>,
) {
  return connection.insertInto('Contents').values(values).execute()
}

function UpdateContentWhereId(connection: ShelfDBConnection, id: number) {
  return connection
    .updateTable('Contents')
    .where('id', '=', id)
    .executeTakeFirst()
}

/**
 * @param values paths -> idx should be related to content id
 * */
async function CreateContentWithPaths(
  connection: ShelfDBConnection,
  values: {
    paths: Omit<InsertObject<DB, 'Paths'>, 'contentId'>[][]
    contents: InsertObject<DB, 'Contents'>[]
  },
) {
  if (!(values.paths instanceof Array) || !(values.contents instanceof Array)) {
    return
  }

  const contentIds = await connection
    .insertInto('Contents')
    .values(values.contents)
    .returning('id')
    .execute()

  return connection
    .insertInto('Paths')
    .values(
      values.paths.flatMap((value, idx) =>
        value.map((v) => ({...v, contentId: contentIds[idx].id})),
      ),
    )
    .execute()
}

async function ListContent(
  connection: ShelfDBConnection,
  pagination: Pagination,
) {
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
    .innerJoin('Paths', 'Contents.id', 'Paths.contentId')
    .leftJoin('ContentTags', 'Contents.id', 'ContentTags.contentId')
    .select((eb) => [
      'Contents.id',
      'Contents.hash',
      'Contents.extension',
      'Contents.createdAt',
      'Paths.path',
      withTagsId(eb),
    ])
    // LIKE PATH Query
    // .where((eb) => eb.or([eb('Paths.path','like','%Some%')]))
    // OR TAG OR TAG OR TAG Query
    // .where('ContentTags.tagId', '=', 1)
    .limit(pagination.limit)
    .offset(pagination.offset)
    //TODO: PASS PARAMETERS FOR THAT
    .orderBy('Contents.id', 'desc')
    .groupBy('Paths.contentId')
    .execute()

  const nextCursor = (
    count.count - (pagination.offset + results.length) > 0
      ? {
          offset: pagination.offset + results.length,
          limit: pagination.limit,
        }
      : undefined
  ) satisfies Cursor

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

export {CreateContentWithPaths, CreateContent, UpdateContentWhereId, ListContent}
