import type {TagColors, Tags} from '../db/kysely-types'

export const defaultColors = [
  {color: '#06b6d4', name: 'Cyan'},
  {color: '#ef4444', name: 'Red'},
  {color: '#f97316', name: 'Orange'},
  {color: '#22c55e', name: 'Green'},
  {color: '#8b5cf6', name: 'Purple'},
  {color: '#202020', name: 'Black'},
  {color: '#A8C0F8', name: 'Light Blue'},
] satisfies Omit<TagColors, 'id'>[]

export const defaultTags = [
  {
    name: 'video',
    colorId: 1,
  },
  {
    name: 'image',
    colorId: 1,
  },
  {
    name: 'document',
    colorId: 1,
  },
] satisfies Omit<Tags, 'id'>[]
