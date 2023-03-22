import clsx from 'clsx'
import {
  forwardRef,
  HTMLAttributes,
  PropsWithChildren,
  Ref,
  useEffect,
  useRef,
  useState,
} from 'react'
import {useTags} from './hooks/useTags'
import {Content, Tag} from 'src/main/src/db/models'
import {useInfiniteQuery} from '@tanstack/react-query'
import {InlineTag} from './components/InlineTag'
import {TaggerContent} from './components/TaggerContent'
import {createPortal} from 'react-dom'
import ContentModal from './ContentModal'
import {useToggle} from './hooks/useToggle'
import {Cog} from './assets/icons'

const pageSize = 25

function Main(): JSX.Element {
  const {tags} = useTags()
  const body = useRef<HTMLDivElement>(null)
  const [selected, setSelected] = useState<Set<Tag>>(new Set())
  const [selectedContent, setSelectedContent] = useState<Content | undefined>()
  const [showDetailsModal, toggleShowDetailsModal] = useToggle(false)
  const bodyRef = useRef<HTMLDivElement>(null)

  const {
    data: content,
    error,
    isLoading,
    isRefetching,
    refetch,
    hasNextPage,
    fetchNextPage,
    remove,
  } = useInfiniteQuery(
    ['content'],
    async (context) => {
      const {pageParam = {offset: 0, limit: pageSize}} = context
      const pagination = pageParam || {offset: 0, limit: pageSize}
      const tags = selected.size > 0 ? Array.from(selected.values()) : undefined

      const files = await window.api.invokeOnMain('getTaggerImages', {
        pagination: {
          offset: pagination.offset,
          limit: pagination.limit,
        },
        tags,
      })
      return files || []
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  )

  useEffect(() => {
    if (!body.current) return
    const onScroll = () => {
      const threshold = 10
      if (!body.current) return
      if (
        window.scrollY + window.innerHeight >=
          body.current.scrollHeight - threshold &&
        hasNextPage &&
        !isRefetching
      ) {
        fetchNextPage()
      }
    }

    window.addEventListener('scroll', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
    }
  }, [hasNextPage, body])

  const openContentModal = (content: Content) => {
    setSelectedContent(content)
    toggleShowDetailsModal(true)
  }
  const closeContentModal = () => {
    setSelectedContent(undefined)
    toggleShowDetailsModal(false)
  }

  const containerClass = clsx('min-h-screen max-h-fit w-full p-10')
  if (error || !content?.pages) {
    return <>{error}</>
  }
  if (isLoading) {
    return <>{isLoading}</>
  }

  return (
    <div
      className={containerClass}
      ref={bodyRef}
    >
      {showDetailsModal &&
        createPortal(
          <ContentModal
            className={'text-6 fixed inset-0 z-50 max-h-screen w-full'}
            content={selectedContent}
            contentProps={{
              className: clsx('bg-opacity-50 bg-black backdrop-blur-xl'),
            }}
            onNext={() => {}}
            onPrevious={() => {}}
            onClose={() => closeContentModal()}
          />,
          document.body,
        )}
      <SearchBar
        tags={tags}
        selected={selected}
        onQuery={() => {
          remove()
          refetch()
        }}
        addSelected={(tag: Tag) => {
          setSelected((_selected) => {
            _selected.add(tag)
            return _selected
          })
        }}
        removeSelected={(tag: Tag) => {
          setSelected((_selected) => {
            const s = new Set(_selected)
            s.delete(tag)
            return s
          })
        }}
      />
      <div className={'flex h-full w-full flex-row-reverse space-x-2 text-end'}>
        <Cog className='ml-1  fill-gray-100 transition-all hover:fill-gray-300 hover:stroke-white' />
        <a className='text-end font-mono text-gray-400'>
          PAGES:
          {content?.pages?.length}
        </a>
        <a className='text-end font-mono text-gray-400'>
          TAGS:
          {tags.length}
        </a>
        <a className='text-end font-mono text-gray-400'>
          TOTAL:
          {(content?.pages || [])
            .map((page) => {
              return page.content.length
            })
            .reduce((total, n) => (total += n))}
        </a>
      </div>
      <Body
        ref={body}
        isLoading={isLoading}
        error={error}
        className={
          'grid w-full sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8'
        }
      >
        {content?.pages?.map((page) => {
          return (page.content || []).map((content) => {
            if (!content?.paths[0]) {
              return
            }

            return (
              <div
                key={content.id}
                className={
                  'relative mx-2 flex h-full max-h-fit min-h-[30vh]  flex-col overflow-clip py-2'
                }
                onClick={() => {
                  openContentModal(content)
                }}
              >
                <TaggerContent
                  content={content}
                  className={'relative h-full w-full'}
                >
                  <span
                    className={
                      'via-teal-20 absolute bottom-0 min-w-full max-w-full animate-gradient_x overflow-hidden text-ellipsis  whitespace-nowrap bg-black bg-opacity-50 font-mono font-bold text-white'
                    }
                  >
                    {content.paths[0].path}
                  </span>
                </TaggerContent>
              </div>
            )
          })
        })}
      </Body>
    </div>
  )
}

const _Body = (
  {
    isLoading,
    error,
    ...props
  }: {isLoading: boolean; error: unknown} & PropsWithChildren &
    HTMLAttributes<HTMLDivElement>,
  ref: Ref<HTMLDivElement>,
) => {
  if (error) {
    return (
      <div
        {...props}
        ref={ref}
      >
        <h1 className='text-6xl'>{error.toString()}</h1>
      </div>
    )
  }
  return (
    <div
      {...props}
      ref={ref}
      className='grid sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8'
    >
      {isLoading ? <></> : props.children}
    </div>
  )
}

const Body = forwardRef(_Body)

export const SearchBar = ({
  tags,
  selected,
  onQuery,
  addSelected,
  removeSelected,
  hidden,
}: {
  tags: Tag[]
  selected: Set<Tag>
  onQuery: () => any
  addSelected: (tag: Tag) => any
  removeSelected: (tag: Tag) => any
  hidden?: boolean
} & HTMLAttributes<HTMLDivElement>) => {
  const [query, setQuery] = useState<string>('')
  const selectedTags = Array.from(selected)
  const TransformedQuery = query?.split(' ')
  const hideDrop = !!TransformedQuery[TransformedQuery.length - 1]
  const DropDownTags = hideDrop
    ? tags.filter((tag) =>
        tag.name
          .toLowerCase()
          .includes(
            TransformedQuery[TransformedQuery.length - 1].toLowerCase(),
          ),
      )
    : []
  const hideSelected = selectedTags.length === 0

  if (hidden === true) {
    return <></>
  }

  return (
    <div className={clsx('relative', hideSelected ? 'mb-5' : '')}>
      <form
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
            'z-20 bg-gradient-to-r from-pink-500 to-cyan-600 bg-clip-text px-10 font-bold text-transparent text-gray-700 ring-gray-300 transition-all hover:bg-clip-border hover:text-white hover:ring-0'
          }
          onClick={onQuery}
        >
          Search
        </button>
      </form>

      <div
        className={
          'absolute top-10 -right-0.5 -left-0.5 z-10 -mt-5 h-auto origin-top border-x-2 border-b-2 border-pink-500 bg-white pt-6'
        }
        hidden={!hideDrop || DropDownTags.length === 0}
      >
        {DropDownTags.map((tag) => {
          return (
            <a
              key={tag.id}
              className='p2 mx-2 my-1  inline-block
            font-mono text-gray-700 underline 
            decoration-pink-500 
            hover:decoration-fuchsia-700 hover:decoration-2'
              onClick={() => {
                setQuery('')
                addSelected(tag)
              }}
            >
              {tag.name}
            </a>
          )
        })}
      </div>
      <div
        className={clsx('-mx-10 my-5 bg-gray-200 px-10 py-2')}
        hidden={hideSelected}
      >
        {selectedTags.map((tag) => {
          return (
            <InlineTag
              key={tag.id}
              tag={tag}
              onClick={() => removeSelected(tag)}
            />
          )
        })}
      </div>
    </div>
  )
}

export default Main
