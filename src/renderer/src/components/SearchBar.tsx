import clsx from 'clsx'
import {HTMLAttributes} from 'react'
import {Tag} from '@models'
import {InlineButton} from './InlineButton'
import {InlineTag} from './InlineTag'
import {useTagQuery} from '../hooks/useTagQuery'
import {useContentQueryStore, ContentQuery} from '../hooks/useQueryStore'

export type pathQuery = {
  value: string
}

export const SearchBar = ({
  markedContent,
  onQuery,
  onBatchAdd,
  onBatchRemove,
  onClear,
}: {
  markedContent: Set<number>
  onQuery: (...any: any[]) => any
  onBatchAdd: (...any: any[]) => any
  onBatchRemove: (...any: any[]) => any
  onClear: (...any: any[]) => any
} & HTMLAttributes<HTMLDivElement>) => {
  const {
    query,
    setQuery,
    foundTags: DropDownTags,
    SplitQuery: TransformedQuery,
  } = useTagQuery()
  const hideDropdown =
    !TransformedQuery[TransformedQuery.length - 1] &&
    TransformedQuery.length === 1


  const {
    query: ContentQuery,
    addQuery,
    removeQuery,
  } = useContentQueryStore()

  const hideSelected = ContentQuery.size === 0

  const {paths: pathQ, tags: tagQ} = Array.from(ContentQuery.values()).reduce(
    (previous, current) => {
      switch (current.type) {
        case 'tag':
          previous.tags.push(current)
          break
        case 'path':
          previous.paths.push(current)
          break
      }

      return previous
    },
    {tags: [], paths: []} as {
      tags: Extract<ContentQuery, {type: 'tag'}>[]
      paths: Extract<ContentQuery, {type: 'path'}>[]
    },
  )

  console.log('pts')
  console.log(pathQ, tagQ)

  return (
    <div
      className={clsx(
        'min-w-screen sticky top-0 z-20 -m-10 bg-surface px-20 pb-7 pt-7',
      )}
    >
      <div className='relative'>
        <div
          className={
            'ringThingClip relative z-20 flex w-full place-content-stretch rounded-full bg-white pl-2'
          }
        >
          <div className='absolute inset-0 h-full w-full rounded-full ring-2 ring-blue-brand' />
          <div className='ringThingFirstLayer absolute inset-0 h-full w-full rounded-full ring-2 ring-green-brand' />
          <div className='ringThingSecondLayer absolute inset-0 h-full w-full rounded-full ring-2 ring-red-brand' />
          <input
            className={
              'z-20 w-full bg-transparent p-2 text-pink-500 outline-none selection:bg-pink-200 hover:border-none active:border-none'
            }
            tabIndex={0}
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
              'z-20 bg-red-brand bg-clip-text px-11 font-bold text-gray-700 text-transparent ring-gray-300 transition-all hover:bg-clip-border hover:text-white hover:ring-0'
            }
            onClick={onQuery}
          >
            Search
          </button>
        </div>
        {!hideDropdown && (
          <div
            className={
              'customGradientBorder absolute -left-0.5 -right-0.5 top-10 z-10 -mt-5 h-auto  origin-top border-x-2 border-b-2 bg-white pt-5 animate-in fill-mode-backwards'
            }
          >
            <div
              tabIndex={1}
              className='w-full select-all overflow-hidden text-ellipsis bg-gray-400 p-2 text-white transition-colors hover:bg-gray-50 hover:text-black focus:bg-gray-50 focus:text-black'
              onClick={() => {
                addQuery({type:'path',path: query})
                setQuery('')
              }}
            >
              Search By Path {query}
            </div>
            <div className='max-h-[40vh] overflow-y-auto'>
              {DropDownTags.map((tag, idx) => {
                return (
                  <InlineTag
                    key={tag.id}
                    tabIndex={idx + 2}
                    tag={tag}
                    onClick={() => {
                      setQuery('')
                      addQuery({
                        type: 'tag',
                        tag: tag,
                        operation: 'include',
                      })
                    }}
                    onSubmit={() => {
                      setQuery('')
                      addQuery({
                        type: 'tag',
                        tag: tag,
                        operation: 'include',
                      })
                    }}
                  />
                )
              })}
            </div>
          </div>
        )}
        <div
          className={clsx(
            '-mx-10 mt-8 flex flex-wrap justify-center bg-gray-200 px-10 py-2',
            hideSelected ? 'hidden' : '',
          )}
        >
          {pathQ.map((query, idx) => (
            <InlineButton
              key={idx}
              onClick={() => {
                removeQuery(query)
              }}
            >
              {query.path}
            </InlineButton>
          ))}
          {tagQ.map((tag) => (
            <InlineTag
              key={tag.tag.id}
              tag={tag.tag}
              onClick={() => removeQuery(tag)}
            />
          ))}
        </div>
        <div
          className={clsx(
            '-mb-5 flex items-center justify-center pt-2.5 text-center align-middle',
            markedContent.size === 0 ? 'hidden' : '',
          )}
        >
          <InlineButton onClick={onBatchAdd}>ADD</InlineButton>
          <InlineButton onClick={onBatchRemove}>REMOVE</InlineButton>
          <InlineButton onClick={onClear}>CLEAR</InlineButton>
        </div>
      </div>
    </div>
  )
}
