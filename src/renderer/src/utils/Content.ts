import {DetailedContent} from 'src/main/db/ContentControllers'
import {Prettify} from 'src/types/utils'

type Content = Prettify<DetailedContent>

function getPathFromContent(content: Content) {
  return content.paths.at(0)?.path ?? null
}

export const openInAnotherProgram = (content?: Content) => {
  if (!content) {
    return
  }

  const path = getPathFromContent(content)

  if (!path) return

  window.open(encodePathIntoURI(path))
}

export const openContentDirectory = (content?: Content) => {
  if (!content) {
    return
  }

  const path = getPathFromContent(content)

  if (!path) {
    return
  }

  window.open('file://' + path.substring(0, path.lastIndexOf('/')))
}

export const encodeContentPathIntoURI = (content: Content) => {
  return encodePathIntoURI(getPathFromContent(content) ?? '')
}

export const contentIntoURI = (content: Content) => {
  const path = getPathFromContent(content) ?? ''
  return encodePathIntoURI(path)
}

export const encodePathIntoURI = (path: string) => {
  const parsedPath = path
    ?.replaceAll('\\', '/')
    .split('/')
    .map((v) => encodeURIComponent(v))
    .join('/')
  return 'file://' + (parsedPath[0] === '/' ? '' : '/') + parsedPath
}

export const GetDirFromURI = (path: string) => {
  return path.substring(0, path.lastIndexOf('/'))
}
