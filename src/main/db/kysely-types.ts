import type {ColumnType} from 'kysely'
export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>
export type Timestamp = ColumnType<Date, Date | string, Date | string>

export type Contents = {
  id: Generated<number>
  hash: string
  extension: string
  createdAt: Generated<string>
}
export type ContentTags = {
  contentId: number
  tagId: number
}
export type Paths = {
  id: Generated<number>
  path: string
  mTimeMs: number
  contentId: number
}
export type TagColors = {
  id: Generated<number>
  name: string
  color: string
}
export type Tags = {
  id: Generated<number>
  name: string
  colorId: number
}
export type DB = {
  Contents: Contents
  ContentTags: ContentTags
  Paths: Paths
  TagColors: TagColors
  Tags: Tags
}
