import {ExpressionBuilder, sql} from 'kysely'
import type {
  ContentTags,
  Contents,
  DB,
  Paths,
  TagColors,
  Tags,
} from './kysely-types'
import {jsonArrayFrom, jsonBuildObject} from 'kysely/helpers/sqlite'
import {Nullable} from 'kysely/dist/cjs/util/type-utils'
import {Cursor, Pagination, ShelfDBConnection} from './ShelfControllers'
import {
  InsertObject,
  InsertObjectOrList,
} from 'kysely/dist/cjs/parser/insert-values-parser'
import {SHELF_LOGGER} from '../utils/Loggers'
import {ContentQuery} from '../../renderer/src/hooks/useQueryStore'

export function CreateContent(
  connection: ShelfDBConnection,
  values: InsertObjectOrList<DB, 'Contents'>,
) {
  if (values instanceof Array && values.length === 0) {
    return
  }
  return connection
    .insertInto('Contents')
    .values(values)
    .onConflict((cb) =>
      cb
        .columns(['hash'])
        .doUpdateSet((eb) => ({extension: eb.ref('Contents.extension')})),
    )
    .executeTakeFirst()
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

export async function CleanupContent(connection: ShelfDBConnection) {
  const dels = await connection
    .deleteFrom('Contents')
    .where((eb) =>
      eb.or([
        eb('Contents.id', 'in', [
          eb
            .selectFrom('Contents')
            .select('Contents.id')
            .leftJoin('Paths', 'Contents.id', 'Paths.contentId')
            .where('Paths.contentId', 'is', null),
        ]),
      ]),
    )
    .execute()

  SHELF_LOGGER.info(`DELETED : ${dels.at(0)?.numDeletedRows}`)
  return dels
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

  const content = await connection
    .insertInto('Contents')
    .values(values.contents)
    .returning(['id', 'hash'])
    .onConflict((cb) =>
      cb
        .columns(['hash'])
        .doUpdateSet((eb) => ({extension: eb.ref('Contents.extension')})),
    )
    .execute()

  await connection
    .insertInto('Paths')
    .values(
      values.paths.flatMap((value, idx) =>
        value.map((v) => ({...v, contentId: content[idx].id})),
      ),
    )
    .execute()

  return content
}

export async function ContentDetails(
  connection: ShelfDBConnection,
  contentId: number,
) {
  const content = await connection
    .selectFrom('Contents')
    .leftJoin('ContentTags', 'Contents.id', 'ContentTags.contentId')
    .leftJoin('Tags', 'ContentTags.tagId', 'Tags.id')
    .select((eb) => [
      'Contents.id',
      'Contents.hash',
      'Contents.extension',
      'Contents.createdAt',
      withTags(eb),
      withPathStrings(eb).as('paths'),
    ])
    .where('Contents.id', '=', contentId)
    .executeTakeFirst()

  return content
}

export async function ListContent(
  connection: ShelfDBConnection,
  options: {
    pagination: Pagination
    query: ContentQuery[]
  },
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

  const {pagination, query} = options

  const queryPaths = query.filter((value) => value.field === 'path')
  const queryTags = query.filter((value) => value.field === 'tag')

  const results = await connection
    .selectFrom('Contents')
    .leftJoin('ContentTags', 'Contents.id', 'ContentTags.contentId')
    .leftJoin('Tags', 'ContentTags.tagId', 'Tags.id')
    .leftJoin(
      (something) =>
        something
          .selectFrom('Paths')
          .select(['Paths.path', 'Paths.contentId'])
          .groupBy('Paths.contentId')
          .as('paths'),
      (join) => join.onRef('paths.contentId', '=', 'Contents.id'),
    )
    .select((eb) => [
      'Contents.id',
      'Contents.hash',
      'Contents.extension',
      'Contents.createdAt',
      withTags(eb),
    ])
    .$if(queryPaths.length > 0, (qb) =>
      qb.where((eb) =>
        eb.or(
          queryPaths.map((value) =>
            eb('paths.path', 'like', `%${value.value}%`),
          ),
        ),
      ),
    )
    .$if(queryTags.length > 0, (qb) =>
      qb.where((eb) =>
        eb.or(
          queryTags.map((value) => eb('Tags.id', '=', value.value as number)),
        ),
      ),
    )
    .groupBy(['Contents.id'])
    .orderBy('Contents.id', 'desc')
    .limit(pagination.limit)
    .offset(pagination.offset)
    .execute()

  console.log(results.at(0))

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
      Paths: Paths
      Contents: Contents
      ContentTags: Nullable<ContentTags>
      TagColors: TagColors
      Tags: Nullable<Tags>
    },
    'Contents' | 'ContentTags' | 'Tags'
  >,
) {
  return jsonArrayFrom(
    eb
      .selectFrom('Paths')
      .select('Paths.path')
      .whereRef('Contents.id', '=', 'Paths.contentId'),
  )
}

export function withTags(
  eb: ExpressionBuilder<
    {
      Contents: Contents
      ContentTags: Nullable<ContentTags>
      Paths: Paths
      TagColors: TagColors
      Tags: Nullable<Tags>
    },
    'Contents' | 'ContentTags' | 'Tags'
  >,
) {
  return eb
    .case()
    .when('Tags.id', 'is not', eb.val(null))
    .then(
      eb.fn.agg<{id: number; name: string; colorId: number}[]>(
        'json_group_array',
        [
          jsonBuildObject({
            id: eb.ref('Tags.id'),
            name: eb.ref('Tags.name'),
            colorId: eb.ref('Tags.colorId'),
          }),
        ],
      ),
    )
    .else(sql.lit(`[]`))
    .end()
    .as('tags')
}

export type DetailedContent = NonNullable<
  Awaited<ReturnType<typeof ContentDetails>>
>

export type ListedContent = Awaited<
  ReturnType<typeof ListContent>
>['content'][number]
