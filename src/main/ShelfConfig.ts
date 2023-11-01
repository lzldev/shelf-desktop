import {app} from 'electron'
import {join} from 'path'
import {z} from 'zod'
import {zJsonSchemaInfer, zJsonValues} from './zJson'
import {existsSync, mkdirSync} from 'fs'

export const CLIENT_CONFIG_FILE_NAME = '/.shelfcfg'
const APP_CONFIG_FILE_NAME = 'config.json'

export const SHELF_THUMB_DEFFAULT_PATH = join(
  app.getPath('userData'),
  '/thumbnail/',
)

export const SHELF_CONFIG_PATH = join(
  app.getPath('userData'),
  APP_CONFIG_FILE_NAME,
)

if (!existsSync(SHELF_THUMB_DEFFAULT_PATH)) {
  mkdirSync(SHELF_THUMB_DEFFAULT_PATH, {
    recursive: true,
  })
}

export const SHELF_CONFIG_SCHEMA = {
  recentFiles: z.array(z.string()),
  ignorePaths: z.array(z.string()),
  pageSize: z.number().min(0),
  defaultColor: z.string().min(0),
  layoutMode: z.enum(['grid', 'masonry', 'experimental']),
  thumbnailPath: z.string(),
} as const

export const SHELF_CLIENT_CONFIG_SCHEMA = {
  additionalPaths: z.array(z.string()),
  ignoredPaths: z.array(z.string()),
  ignoreHidden: z.boolean(),
  ignoreUnsupported: z.boolean(),
  ai_worker:z.boolean(),
} as const

export type ShelfClientConfig = zJsonSchemaInfer<
  typeof SHELF_CLIENT_CONFIG_SCHEMA
>
export type ShelfClientConfigValues = zJsonValues<
  typeof SHELF_CLIENT_CONFIG_SCHEMA
>
export type ShelfConfigType = zJsonSchemaInfer<typeof SHELF_CONFIG_SCHEMA>
