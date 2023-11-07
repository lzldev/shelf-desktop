import {ExpressionBuilder} from 'kysely'
import type {
  ContentTags,
  Contents,
  DB,
  Paths,
  TagColors,
  Tags,
} from './kysely-types'
import {jsonArrayFrom} from 'kysely/helpers/sqlite'
import {Nullable} from 'kysely/dist/cjs/util/type-utils'
import {Cursor, Pagination, ShelfDBConnection} from './ShelfControllers'
import {
  InsertObject,
  InsertObjectOrList,
} from 'kysely/dist/cjs/parser/insert-values-parser'

export function CreateContent(
  connection: ShelfDBConnection,
  values: InsertObjectOrList<DB, 'Contents'>,
) {
  if (values instanceof Array && values.length === 0) {
    return
  }
  return connection.insertInto('Contents').values(values).executeTakeFirst()
}

export function UpdateContentWhereId(
  connection: ShelfDBConnection,
  id: number,
) {
  return connection
    .updateTable('Contents')
    .where('id', '=', id)
    .executeTakeFirst()
}

export async function ClearOrphanedContents(connection: ShelfDBConnection) {
  return connection
    .deleteFrom('Contents')
    .where((eb) =>
      eb(
        'Contents.id',
        'in',
        eb
          .selectFrom('Contents')
          .select('Contents.id')
          .leftJoin('Paths', 'Contents.id', 'Paths.contentId')
          .where('Paths.contentId', 'is', null),
      ),
    )
    .execute()
}

/**
 * @param values paths -> idx should be related to content id
 * */
export async function CreateContentWithPaths(
  connection: ShelfDBConnection,
  values: {
    paths: Omit<InsertObject<DB, 'Paths'>, 'contentId'>[][]
    contents: InsertObject<DB, 'Contents'>[]
  },
) {
  if (values.paths instanceof Array && values.paths.length === 0) {
    return
  } else if (
    !(values.paths instanceof Array) ||
    !(values.contents instanceof Array)
  ) {
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

export async function ContentDetails(
  connection: ShelfDBConnection,
  contentId: number,
) {
  return await connection
    .selectFrom('Contents')
    .leftJoin('Paths', 'Contents.id', 'Paths.contentId')
    .leftJoin('ContentTags', 'Contents.id', 'ContentTags.contentId')
    .select((eb) => [
      'Contents.id',
      'Contents.hash',
      'Contents.extension',
      'Contents.createdAt',
      withTagsId(eb),
      withPathStrings(eb).as('paths'),
    ])
    .where('Contents.id', '=', contentId)
    .executeTakeFirst()
}

export async function ListContent(
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
export function withPathStrings(
  eb: ExpressionBuilder<
    {
      Contents: Contents
      ContentTags: Nullable<ContentTags>
      Paths: Nullable<Paths>
      TagColors: TagColors
      Tags: Tags
    },
    'Contents' | 'ContentTags' | 'Paths'
  >,
) {
  return jsonArrayFrom(
    eb
      .selectFrom('Paths')
      .select('Paths.path')
      .whereRef('Contents.id', '=', 'Paths.contentId'),
  )
}

export function withTagsId(
  eb: ExpressionBuilder<
    {
      Contents: Contents
      ContentTags: Nullable<ContentTags>
      Paths: Nullable<Paths>
      TagColors: TagColors
      Tags: Tags
    },
    'Contents' | 'ContentTags' | 'Paths'
  >,
) {
  return jsonArrayFrom(
    eb
      .selectFrom('Tags')
      .select('Tags.id')
      .whereRef('ContentTags.tagId', '=', 'Tags.id'),
  ).as('tags')
}

export type DetailedContent = NonNullable<
  Awaited<ReturnType<typeof ContentDetails>>
>
export type ListedContent = Awaited<
  ReturnType<typeof ListContent>
>['content'][number]
