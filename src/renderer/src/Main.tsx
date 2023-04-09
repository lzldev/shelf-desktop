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
import ContentDetails from './ContentDetails'
import {useToggle} from './hooks/useToggle'
import {Cog, PlusSign} from './assets/icons'
import {useOrderStore} from './hooks/useOrderStore'
import {Dropdown} from './components/Dropdown'
import {useConfig} from './hooks/useConfig'
import {InlineButton} from './components/InlineButton'
import {TagColorThing} from './components/TagColorThing'
import CreateTagModal from './CreateTagModal'

function Main(): JSX.Element {
  const {config} = useConfig()
  const {tags} = useTags()
  const body = useRef<HTMLDivElement>(null)
  const [selectedTags, setSelectedTags] = useState<Set<Tag>>(new Set())
  const [pathQueries, setPathQueries] = useState<Set<pathQuery>>(new Set())
  const [selectedContent, setSelectedContent] = useState<Content | undefined>()
  const {
    value: showContentModal,
    turnOn: openContentModal,
    turnOff: closeContentModal,
  } = useToggle(
    false,
    (content: Content) => {
      setSelectedContent(content)
    },
    () => {
      setSelectedContent(undefined)
    },
  )
  const {
    value: showCreateTagModal,
    turnOn: openCreateTagModal,
    turnOff: closeCreateTagModal,
  } = useToggle(false)
  const bodyRef = useRef<HTMLDivElement>(null)
  const {orderDirection, orderField, toggleDirection} = useOrderStore()

  const {
    data: content,
    error,
    isLoading,
    isFetching,
    isRefetching,
    refetch,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery(
    ['content'],
    async (context) => {
      const {orderDirection, orderField} = useOrderStore.getState()
      const {pageParam = {offset: 0, limit: config.pageSize}} = context
      const pagination = pageParam || {offset: 0, limit: config.pageSize}
      const tags =
        selectedTags.size > 0 ? Array.from(selectedTags.values()) : undefined

      const files = await window.api.invokeOnMain('getTaggerImages', {
        pagination: {
          offset: pagination.offset,
          limit: pagination.limit,
        },
        paths: Array.from(pathQueries),
        order: [orderField, orderDirection],
        tags,
      })
      return files || []
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  )

  useEffect(() => {
    useOrderStore.subscribe(() => {
      console.log('refetch [subscribe] ->')
      refetch()
    })
  }, [])

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
      {showContentModal &&
        createPortal(
          <ContentDetails
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
      {showCreateTagModal &&
        createPortal(
          <CreateTagModal onClose={() => closeCreateTagModal()} />,
          document.body,
        )}
      <SearchBar
        tags={tags}
        selected={selectedTags}
        onQuery={() => {
          refetch()
        }}
        addPathQuery={(query) => {
          setPathQueries((_pathQueries) => {
            _pathQueries.add(query)
            return _pathQueries
          })
        }}
        removePathQuery={(query) => {
          setPathQueries((oldSet) => {
            const pathQueries = new Set(oldSet)
            pathQueries.delete(query)
            return pathQueries
          })
        }}
        pathQueries={pathQueries}
        addSelected={(tag) => {
          setSelectedTags((_selected) => {
            _selected.add(tag)
            return _selected
          })
        }}
        removeSelected={(tag: Tag) => {
          setSelectedTags((oldSet) => {
            const selected = new Set(oldSet)
            selected.delete(tag)
            return selected
          })
        }}
      />
      <div
        className={clsx(
          'mt-12 flex h-full w-full flex-row-reverse space-x-2 text-end',
        )}
      >
        <Dropdown
          triggerRender={() => (
            <Cog className='ml-1  fill-gray-100 transition-all hover:fill-gray-300 hover:stroke-white' />
          )}
        >
          <div
            className='flex p-2 transition-colors hover:bg-gray-500 hover:text-white'
            onClick={() => {
              openCreateTagModal()
            }}
          >
            <PlusSign />
            <span>ADD TAG</span>
          </div>
          <div
            className='flex p-2 transition-colors hover:bg-gray-500 hover:text-white'
            onClick={() => {}}
          >
            <span>EDIT TAGS</span>
          </div>
          <div
            className='flex p-2 transition-colors hover:bg-gray-500 hover:text-white'
            onClick={() => {}}
          >
            <span>EDIT COLORS</span>
          </div>
        </Dropdown>
        <a
          className='text-end font-mono text-gray-400'
          onClick={() => {
            toggleDirection()
          }}
        >
          ORDER:
          {`${orderField}-${orderDirection}`}
        </a>
        <a className='text-end font-mono text-gray-400'>
          PAGES:
          {content?.pages?.length}
        </a>
        <a className='text-end font-mono text-gray-400'>
          TAGS:
          {tags.length}
        </a>
        <a className='text-end font-mono text-gray-400'>
          SHOWING:
          {content
            .pages!.map((page) => {
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
          'grid w-full auto-rows-[35vh] gap-x-3 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-6'
        }
      >
        {content?.pages?.map((page) => {
          return page.content!.map((content) => (
            <div
              key={content.id}
              className={'relative flex flex-col overflow-clip py-2'}
              onClick={() => {
                openContentModal(content)
              }}
            >
              <TaggerContent
                content={content}
                className={'relative h-full w-full'}
              >
                <TagColorThing
                  className='absolute inset-x-0 top-0 flex h-1 w-full flex-row overflow-hidden'
                  tags={content.tags}
                />
                <span
                  dir='rtl'
                  className={
                    'absolute inset-x-0 bottom-0 max-h-fit w-full max-w-full overflow-hidden text-ellipsis whitespace-nowrap bg-black bg-opacity-50 px-1 text-center font-mono text-xs text-white'
                  }
                >
                  {content.paths[0].path}
                </span>
              </TaggerContent>
            </div>
          ))
        })}
      </Body>
      {isFetching ? (
        <div className='flex items-center justify-center py-10'>
          <Cog className='h-14 w-14 animate-spin' />
        </div>
      ) : null}
    </div>
  )
}

type pathQuery = {
  value: string
}

export default Main

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
        'min-w-screen : sticky top-0 z-20 -m-10 bg-gray-300 px-10 pt-7 pb-7',
      )}
    >
      <div className='relative'>
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
            'absolute top-10 -right-0.5 -left-0.5 z-10 -mt-5 h-auto origin-top border-x-2 border-b-2 border-pink-500 bg-white pt-5'
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
    >
      {isLoading ? <></> : props.children}
    </div>
  )
}

const Body = forwardRef(_Body)
