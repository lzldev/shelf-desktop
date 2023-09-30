import type {ColumnType} from 'kysely'
export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>
export type Timestamp = ColumnType<Date, Date | string, Date | string>

export type Contents = {
  id: Generated<number>
  hash: string | null
  extension: string | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}
export type ContentTags = {
  contentId: number
  tagId: number
  createdAt: Generated<string>
  updatedAt: string
}
export type Paths = {
  id: Generated<number>
  path: string | null
  mTimeMs: number | null
  contentId: number | null
  createdAt: Generated<string>
  updatedAt: string
}
export type TagColors = {
  id: Generated<number>
  name: string | null
  color: string | null
  createdAt: Generated<string>
  updatedAt: string
}
export type Tags = {
  id: Generated<number>
  name: string | null
  colorId: number | null
  createdAt: string
  updatedAt: string
}
export type DB = {
  Contents: Contents
  ContentTags: ContentTags
  Paths: Paths
  TagColors: TagColors
  Tags: Tags
}
