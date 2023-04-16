import clsx from 'clsx'
import {HTMLAttributes, useMemo, useState} from 'react'
import {Tag} from 'src/main/src/db/models'
import {InlineButton} from './InlineButton'
import {InlineTag} from './InlineTag'
import {useQueries} from '@tanstack/react-query'
import {useColors} from '@renderer/hooks/useColors'

export type pathQuery = {
  value: string
}

export const SearchBar = ({
  tags,
  selected,
  pathQueries,
  onQuery,
  addPathQuery,
  removePathQuery,
  addSelected,
  removeSelected,
  hidden,
}: {
  tags: Tag[]
  selected: Set<Tag>
  pathQueries: Set<pathQuery>
  onQuery: () => any
  addPathQuery: (query: pathQuery) => any
  removePathQuery: (query: pathQuery) => any
  addSelected: (tag: Tag) => any
  removeSelected: (tag: Tag) => any
  hidden?: boolean
} & HTMLAttributes<HTMLDivElement>) => {
  const [query, setQuery] = useState<string>('')
  const TransformedQuery = query?.split(' ')
  const hideDrop =
    !TransformedQuery[TransformedQuery.length - 1] &&
    TransformedQuery.length === 1
  const DropDownTags = !hideDrop
    ? tags.filter((tag) =>
        tag.name
          .toLowerCase()
          .includes(
            TransformedQuery[TransformedQuery.length - 1].toLowerCase(),
          ),
      )
    : []

  const hideSelected = selected.size === 0 && pathQueries.size === 0

  if (hidden === true) {
    return <></>
  }

  return (
    <div
      className={clsx(
        'min-w-screen : sticky top-0 z-20 -m-10 bg-gray-300 px-10 pb-7 pt-7',
      )}
    >
      <div className='relative'>
        <div
          className={
            'z-20 flex w-full place-content-stretch overflow-clip rounded-full bg-white pl-2 ring-2 ring-pink-500'
          }
        >
          <input
            className={
              'z-20 w-full bg-transparent p-2 text-pink-500 outline-none selection:bg-pink-200 hover:border-none active:border-none'
            }
            type={'text'}
            value={query}
            list='tag-list'
            onChange={(evt) => {
              setQuery(evt.target.value)
            }}
            onSubmit={(evt) => {
              evt.preventDefault()
              evt.stopPropagation()
            }}
            onKeyDown={(evt) => {
              if (evt.key === 'Enter') {
                onQuery()
              }
            }}
          />
          <button
            className={
              'z-20 bg-[--queryColor] bg-pink-500 bg-clip-text px-10 font-bold text-gray-700 text-transparent ring-gray-300 transition-all hover:bg-clip-border hover:text-white hover:ring-0'
            }
            onClick={onQuery}
          >
            Search
          </button>
        </div>
        <div
          className={
            'absolute -left-0.5 -right-0.5 top-10 z-10 -mt-5 h-auto origin-top border-x-2 border-b-2 border-pink-500 bg-white pt-5 animate-in fill-mode-backwards'
          }
          hidden={hideDrop}
        >
          <div
            className='selectable w-full overflow-hidden text-ellipsis bg-gray-400 p-2 text-white transition-colors hover:bg-gray-50 hover:text-black'
            onClick={() => {
              addPathQuery({value: query})
              setQuery('')
            }}
          >
            Search By Path {query}
          </div>
          {DropDownTags.map((tag) => {
            return (
              <InlineTag
                key={tag.id}
                tag={tag}
                onClick={() => {
                  setQuery('')
                  addSelected(tag)
                }}
              />
            )
          })}
        </div>
        <div
          className={clsx(
            '-mx-10 mt-8 flex flex-wrap justify-center bg-gray-200 px-10 py-2',
            hideSelected ? 'hidden' : '',
          )}
        >
          {Array.from(pathQueries).map((query, idx) => (
            <InlineButton
              key={idx}
              onClick={() => {
                removePathQuery(query)
              }}
            >
              {query.value}
            </InlineButton>
          ))}
          {Array.from(selected).map((tag) => (
            <InlineTag
              key={tag.id}
              tag={tag}
              onClick={() => removeSelected(tag)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
