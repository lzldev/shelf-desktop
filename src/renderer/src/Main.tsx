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
import {TaggerContent} from './components/TaggerContent'
import {createPortal} from 'react-dom'
import {ContentDetails} from './ContentDetails'
import {useToggle} from './hooks/useToggle'
import {useOrderStore} from './hooks/useOrderStore'
import {Dropdown} from './components/Dropdown'
import {useConfig} from './hooks/useConfig'
import {TagColorThing} from './components/TagColorThing'
import {CreateTagModal} from './CreateTagModal'
import {EditColors} from './EditColors'
import {pathQuery, SearchBar} from './components/SearchBar'
import {Cog, PlusSign} from './components/Icons'
import {EditTags} from './EditTags'

function Main(): JSX.Element {
  const {config} = useConfig()
  const {tags} = useTags()
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

  const {
    value: showEditTagsModal,
    turnOn: openEditTagsModal,
    turnOff: closeEditTagsModal,
  } = useToggle(false)

  const {
    value: showEditColorsModal,
    turnOn: openEditColorsModal,
    turnOff: closeEditColorsModal,
  } = useToggle(false)

  const rootRef = useRef<HTMLDivElement>(null)
  const contentList = useRef<HTMLDivElement>(null)
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
      refetch()
    })
  }, [])

  useEffect(() => {
    if (!contentList.current) return
    const onScroll = () => {
      if (!contentList.current) return
      const threshold = 100

      if (
        window.scrollY + window.innerHeight >=
          contentList.current.scrollHeight - threshold &&
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
  }, [hasNextPage, contentList])

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
      ref={rootRef}
    >
      {showContentModal &&
        createPortal(
          <ContentDetails
            className={'text-6 fixed inset-0 z-50 max-h-screen w-full'}
            content={selectedContent}
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
      {showEditColorsModal &&
        createPortal(
          <EditColors
            onClose={() => closeEditColorsModal()}
            className={clsx(showEditColorsModal && 'peer:translate-x-0')}
          />,
          document.body,
        )}
      {showEditTagsModal &&
        createPortal(
          <EditTags onClose={() => closeEditTagsModal()} />,
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
            onClick={openEditTagsModal}
          >
            <span>EDIT TAGS</span>
          </div>
          <div
            className='flex p-2 transition-colors hover:bg-gray-500 hover:text-white'
            onClick={openEditColorsModal}
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
        ref={contentList}
        isLoading={isLoading}
        error={error}
        className={
          'grid w-full auto-rows-[35vh] gap-x-3 gap-y-3 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-6'
        }
      >
        {content?.pages?.map((page) => {
          return page.content!.map((content) => (
            <TaggerContent
              key={content.id}
              onClick={() => {
                openContentModal(content)
              }}
              content={content}
              contentProps={{
                className: 'cursor-pointer',
              }}
              className={'relative h-full w-full'}
            >
              <TagColorThing
                className='absolute inset-x-0 top-0 flex h-1.5 w-full flex-row overflow-hidden'
                tags={content.tags}
              />
            </TaggerContent>
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

export {Main}

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
