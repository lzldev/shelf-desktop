import {InfiniteData} from '@tanstack/react-query'
import {Content} from '@models'

export function MarkContent(
  markerIdx: [number, number],
  pageIdx: number,
  contentIdx: number,
  contentQuery: InfiniteData<{
    content: Content[]
    nextCursor?: {offset: number; limit: number} | undefined
  }>,
) {
  const toBeMarked: number[] = []

  const [fromPage, fromContent] = markerIdx

  const direction =
    fromPage < pageIdx || (fromPage === pageIdx && fromContent < contentIdx)
  const startPage = direction ? fromPage : pageIdx
  const endPage = direction ? pageIdx : fromPage
  const startContent = direction ? fromContent : contentIdx
  const endContent = direction ? contentIdx : fromContent

  for (let pIdx = startPage; pIdx <= endPage; pIdx++) {
    const startOfPage = pIdx === startPage ? startContent : 0
    const endOfPage =
      pIdx === endPage ? endContent : contentQuery!.pages[pIdx]!.content.length

    for (let cIdx = startOfPage; cIdx < endOfPage; cIdx++) {
      toBeMarked.push(contentQuery.pages[pIdx].content[cIdx].id)
    }
  }
  return toBeMarked
}
