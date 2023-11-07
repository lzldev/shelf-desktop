import {DetailedContent, ListedContent} from 'src/main/db/ContentControllers'
import {Prettify} from 'src/types/utils'

type Content = Prettify<ListedContent | DetailedContent>

function getPathFromContent(content: Content) {
  if (!content) {
    throw 'invalid'
  }

  if ('path' in content) {
    return content.path
  } else if (content.paths instanceof Array && content.paths.at(0)) {
    return content.paths.at(0)!.path!
  } else {
    throw 'Invalid Content'
  }
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

  window.open('file://' + path.substring(0, path.lastIndexOf('\\')))
}

export const encodeContentPathIntoURI = (content: Content) => {
  return encodePathIntoURI(getPathFromContent(content) ?? '')
}

export const contentIntoURI = (content: Content) => {
  return encodePathIntoURI(getPathFromContent(content))
}

export const encodePathIntoURI = (path: string) => {
  const parsedPath = path
    ?.replaceAll('\\', '/')
    .split('/')
    .map((v) => encodeURIComponent(v))
    .join('/')

  return 'file://' + parsedPath
}

export const GetDirFromURI = (path: string) => {
  return path.substring(0, path.lastIndexOf('/'))
}
