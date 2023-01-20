import { Dirent } from 'fs'

interface TaggerFile extends Dirent {
  fullPath: string
}

// type TaggerFile = {
//   fullPath: string
// } & Dirent

interface TaggerImage extends TaggerFile {
  isImage?: true
}

interface TaggerDir extends TaggerFile {
  isDir?: true
  depth?: number
  children: TaggerFile[]
}

export type { TaggerFile, TaggerImage, TaggerDir }
