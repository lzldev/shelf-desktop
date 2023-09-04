import {Content as ContentModel} from 'src/main/src/db/models'
import {ContentFields} from 'src/main/src/db/models/Content'

export type Content = ContentFields

export const openInAnotherProgram = (content?: Content) => {
  if (!content) {
    return
  }
  const path = content?.paths?.at(0)?.path

  if (!path) return

  window.open(encodePathIntoURI(path))
}

export const openContentDirectory = (content?: Content) => {
  if (!content) {
    return
  }
  window.open(
    'file://' +
      content?.paths
        ?.at(0)
        ?.path.substring(0, content?.paths?.at(0)?.path.lastIndexOf('\\')),
  )
}

export const encodeContentPathIntoURI = (content: Content) => {
  const path = content?.paths?.at(0)?.path ?? ''

  return encodePathIntoURI(path)
}

// export const encodePath = (path: string) =>
//   path
//     ?.replaceAll('\\', '/')
//     .split('/')
//     .map((v) => encodeURIComponent(v))
//     .join('/')

export const encodePathIntoURI = (path: string) => {
  const parsed_path = path
    ?.replaceAll('\\', '/')
    .split('/')
    .map((v) => encodeURIComponent(v))
    .join('/')

  return 'file://' + parsed_path
}

export const GetDirFromURI = (path: string) => {
  return path.substring(0, path.lastIndexOf('/'))
}
