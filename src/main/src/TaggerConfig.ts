import {app} from 'electron'
import {join} from 'path'
import {z} from 'zod'
import {zJsonSchemaInfer, zJsonValues} from './zJson'

export const TAGGER_CONFIG_PATH = join(app.getPath('userData'), 'config.json')
export const TAGGER_CONFIG_SCHEMA = {
  recentFiles: z.array(z.string()),
  ignorePaths: z.array(z.string()),
  pageSize: z.number().min(0),
  defaultColor: z.string().min(0),
  layoutMode: z.enum(['grid', 'masonry']),
} as const
export type TaggerConfigType = zJsonSchemaInfer<typeof TAGGER_CONFIG_SCHEMA>

export const CLIENT_CONFIG_FILE_NAME = '/.taggercfg'
export const ClientConfigSchema = {
  additionalPaths: z.array(z.string()),
} as const
export type ClientConfigSchema = typeof ClientConfigSchema
export type ClientConfigValues = zJsonValues<typeof ClientConfigSchema>
