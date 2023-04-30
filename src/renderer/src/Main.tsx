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
import {useImmer} from 'use-immer'
import {useHotkeysRef} from './hooks/useHotkeys'

function Main(): JSX.Element {
  const {config} = useConfig()
  const {tags} = useTags()
  const [modalContent, setModalContent] = useState<Content | undefined>()
  const [selectedTags, setSelectedTags] = useImmer<Set<Tag>>(new Set())
  const [pathQueries, setPathQueries] = useImmer<Set<pathQuery>>(new Set())
  const [markedContent, setMarkedContent] = useImmer<Set<number>>(new Set())
  const {orderDirection, orderField, toggleDirection} = useOrderStore()
  const contentList = useRef<HTMLDivElement>(null)

  const {keys} = useHotkeysRef({
    Shift: {
      down: () => {},
      up: () => {
        markerIdx.current = undefined
      },
    },
  })
  const markerIdx = useRef<[pageNumber: number, contentNumber: number]>()

  const {
    value: showContentModal,
    turnOn: openContentModal,
    turnOff: closeContentModal,
  } = useToggle(
    false,
    (content: Content) => {
      setModalContent(content)
    },
    () => {
      setModalContent(undefined)
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

  const {
    data: contentQuery,
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
  if (error || !contentQuery?.pages) {
    return <>{error}</>
  }
  if (isLoading) {
    return <>{isLoading}</>
  }

  return (
    <div className={containerClass}>
      {showContentModal &&
        createPortal(
          <ContentDetails
            className={'text-6 fixed inset-0 z-50 max-h-screen w-full'}
            content={modalContent}
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
        selected={selectedTags}
        markedContent={markedContent}
        onQuery={() => {
          refetch()
        }}
        addPathQuery={(query) => {
          setPathQueries((_pathQueries) => {
            _pathQueries.add(query)
          })
        }}
        removePathQuery={(query) => {
          setPathQueries((queries) => {
            queries.delete(query)
          })
        }}
        pathQueries={pathQueries}
        addSelected={(tag) => {
          setSelectedTags((selectedTags) => {
            selectedTags.add(tag)
          })
        }}
        removeSelected={(tag: Tag) => {
          setSelectedTags((selectedTags) => {
            selectedTags.delete(tag)
          })
        }}
        onClear={() => {
          setMarkedContent(new Set())
        }}
      />
      <div
        className={
          'mt-12 flex h-full w-full flex-row-reverse space-x-2 text-end'
        }
      >
        <OptionsDropdown
          openCreateTagModal={openCreateTagModal}
          openEditTagsModal={openEditTagsModal}
          openEditColorsModal={openEditColorsModal}
        />
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
          {contentQuery
            .pages!.map((page) => {
              return page.content.length
            })
            .reduce((total, n) => (total += n))}
        </a>
        {markedContent.size !== 0 && (
          <a className='text-end font-mono text-gray-400'>
            SELECTED:
            {markedContent.size}
          </a>
        )}
      </div>
      <Body
        ref={contentList}
        isLoading={isLoading}
        error={error}
        className={
          'grid w-full auto-rows-[25vh] gap-x-3 gap-y-3 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-6'
        }
      >
        {contentQuery?.pages?.map((page, pageIdx) => {
          return page.content!.map((content, contentIdx) => (
            <TaggerContent
              key={content.id}
              className={'group/content relative h-full w-full'}
              onClick={() => {
                openContentModal(content)
              }}
              content={content}
              contentProps={{
                className: 'cursor-pointer',
              }}
            >
              <TagColorThing
                className='absolute inset-x-0 top-0 flex h-1.5 w-full flex-row overflow-hidden'
                tags={content.tags}
              />
              <input
                type='checkbox'
                checked={markedContent.has(content.id)}
                className={clsx(
                  'invisible absolute right-[1rem] top-[1.33rem] text-3xl checked:visible group-hover/content:visible',
                )}
                onClick={(evt) => {
                  evt.stopPropagation()
                  if (!keys.current.Shift || !markerIdx.current) {
                    return
                  }
                  const toBeMarked: number[] = []

                  const [fromPage, fromContent] = markerIdx.current

                  //True = Forwards | False = Backwards
                  const direction =
                    fromPage < pageIdx ||
                    (fromPage === pageIdx && fromContent < contentIdx)

                  const startPage = direction ? fromPage : pageIdx
                  const endPage = direction ? pageIdx : fromPage
                  const startContent = direction ? fromContent : contentIdx
                  const endContent = direction ? contentIdx : fromContent

                  for (let pIdx = startPage; pIdx <= endPage; pIdx++) {
                    const startOfPage = pIdx === startPage ? startContent : 0
                    const endOfPage =
                      pIdx === endPage
                        ? endContent
                        : contentQuery!.pages[pIdx]!.content.length

                    for (let cIdx = startOfPage; cIdx < endOfPage; cIdx++) {
                      toBeMarked.push(contentQuery.pages[pIdx].content[cIdx].id)
                    }
                  }

                  setMarkedContent((marked) => {
                    toBeMarked.forEach((v) => {
                      marked.add(v)
                    })
                  })
                }}
                onChange={(evt) => {
                  markerIdx.current = [pageIdx, contentIdx]
                  const checked = evt.currentTarget.checked
                  setMarkedContent((markedContent) => {
                    if (checked) {
                      markedContent.add(content.id)
                    } else {
                      markedContent.delete(content.id)
                    }
                  })
                  evt.stopPropagation()
                }}
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

const Body = forwardRef(function Body(
  {
    isLoading,
    error,
    ...props
  }: {isLoading: boolean; error: unknown} & PropsWithChildren &
    HTMLAttributes<HTMLDivElement>,
  ref: Ref<HTMLDivElement>,
) {
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
})

function OptionsDropdown(props: {
  openCreateTagModal: (...any: any[]) => any
  openEditTagsModal: (...any: any[]) => any
  openEditColorsModal: (...any: any[]) => any
}) {
  return (
    <Dropdown
      triggerRender={() => (
        <Cog className='mb-1 ml-1  fill-gray-100 transition-colors hover:fill-gray-300 hover:stroke-white' />
      )}
    >
      <div
        className='flex p-2 transition-colors hover:bg-gray-500 hover:text-white'
        onClick={() => {
          props.openCreateTagModal()
        }}
      >
        <PlusSign />
        <span>ADD TAG</span>
      </div>
      <div
        className='flex p-2 transition-colors hover:bg-gray-500 hover:text-white'
        onClick={props.openEditTagsModal}
      >
        <span>EDIT TAGS</span>
      </div>
      <div
        className='flex p-2 transition-colors hover:bg-gray-500 hover:text-white'
        onClick={props.openEditColorsModal}
      >
        <span>EDIT COLORS</span>
      </div>
    </Dropdown>
  )
}
