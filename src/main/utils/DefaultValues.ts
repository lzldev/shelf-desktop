import {InsertObject} from 'kysely'
import type {DB, Tags} from '../db/kysely-types'

export const defaultColors = [
  {color: '#06b6d4', name: 'Cyan'},
  {color: '#ef4444', name: 'Red'},
  {color: '#f97316', name: 'Orange'},
  {color: '#22c55e', name: 'Green'},
  {color: '#8b5cf6', name: 'Purple'},
  {color: '#202020', name: 'Black'},
  {color: '#A8C0F8', name: 'Light Blue'},
] satisfies Readonly<InsertObject<DB, 'TagColors'>[]>

export const defaultTags = [
  {
    name: 'video',
    colorId: 3,
  },
  {
    name: 'image',
    colorId: 1,
  },
  {
    name: 'document',
    colorId: 2,
  },
] as const satisfies Readonly<Omit<Tags, 'id'>[]>

export const defaultTagNames = defaultTags.map((value) => value.name)

export type defaultTagNames = (typeof defaultTags)[number]['name']
