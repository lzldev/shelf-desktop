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
import {useInfiniteQuery} from '@tanstack/react-query'
import {createPortal} from 'react-dom'
import {ContentDetails} from './ContentDetails'
import {useToggle} from './hooks/useToggle'
import {useOrderStore} from './hooks/useOrderStore'
import {Dropdown} from './components/Dropdown'
import {useConfigStore} from './hooks/useConfig'
import {TagColorThing} from './components/TagColorThing'
import {EditColors} from './EditColors'
import {SearchBar} from './components/SearchBar'
import {EditTags} from './EditTags'
import {useImmer} from 'use-immer'
import {useHotkeysRef} from './hooks/useHotkeys'
import {MasonryInfiniteGrid} from '@egjs/react-infinitegrid'
import {OptionsModal} from './OptionsModal'
import {ArrowPathIcon, Cog8ToothIcon} from '@heroicons/react/24/solid'
import {MarkContent} from './utils/Main'
import {ContentPreview} from './components/ContentPreview'
import {useContentQueryStore} from './hooks/useQueryStore'
import {ListedContent} from 'src/main/db/ContentControllers'

function Main(): JSX.Element {
  const config = useConfigStore((s) => s.config)
  const {tags} = useTags()

  const contentQuery = useContentQueryStore((s) => s.query)

  const [modalContent, setModalContent] = useState<ListedContent | undefined>()

  const [markedContent, setMarkedContent] = useImmer<Set<number>>(new Set())

  const {orderDirection, orderField, toggleDirection} = useOrderStore()
  const contentContainer = useRef<HTMLDivElement & MasonryInfiniteGrid>(null)
  const markerIdx = useRef<[pageNumber: number, contentNumber: number]>()

  const {keys} = useHotkeysRef({
    Shift: {
      down: () => {},
      up: () => {
        markerIdx.current = undefined
      },
    },
  })

  const {
    data: contentList,
    error,
    isLoading,
    isFetching,
    refetch,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery(
    ['content'],
    async (context) => {
      const {orderDirection, orderField} = useOrderStore.getState()

      const {
        pageParam = {
          offset: 0,
          limit: config!.pageSize,
        },
      } = context

      const pagination = pageParam ?? {
        offset: 0,
        limit: config!.pageSize,
      }

      const query = Array.from(contentQuery.values())

      const files = await window.api.invokeOnMain('getShelfContent', {
        query: query,
        pagination,
        order: [orderField, orderDirection],
      })

      return files
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  )

  useEffect(() => {
    if (!contentContainer.current) return

    const onScroll = () => {
      if (!contentContainer.current) return
      const threshold = 100

      if (
        window.scrollY + window.innerHeight >=
          contentContainer.current.clientHeight - threshold &&
        hasNextPage &&
        !isFetching
      ) {
        fetchNextPage()
      }
    }

    window.addEventListener('resize', onScroll)
    window.addEventListener('scroll', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [hasNextPage, contentContainer])

  const {
    value: showContentModal,
    turnOn: openContentModal,
    turnOff: closeContentModal,
  } = useToggle(
    false,
    (content: ListedContent) => {
      setModalContent(content)
    },
    () => {
      setModalContent(undefined)
    },
  )

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
    value: showOptionsModal,
    turnOn: openOptionsModal,
    turnOff: closeOptionsModal,
  } = useToggle(false)

  if (error || !contentList?.pages) {
    return <>{error}</>
  }
  if (isLoading) {
    return <>{isLoading}</>
  }

  return (
    <div
      className={clsx(
        'isolate max-h-fit min-h-screen w-full overflow-clip bg-background',
      )}
    >
      {showContentModal &&
        createPortal(
          <ContentDetails
            className={'text-6 fixed inset-0 z-50 max-h-screen w-full'}
            initialContent={modalContent}
            onClose={() => closeContentModal()}
          />,
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
      {showOptionsModal &&
        createPortal(
          <OptionsModal onClose={() => closeOptionsModal()} />,
          document.body,
        )}
      <SearchBar
        markedContent={markedContent}
        onQuery={() => {
          refetch()
        }}
      />
      <div
        className={
          'static mt-24 flex h-full w-full flex-row-reverse space-x-2 px-5 text-end'
        }
      >
        <OptionsDropdown
          openEditTagsModal={openEditTagsModal}
          openEditColorsModal={openEditColorsModal}
          openOptionsModal={openOptionsModal}
        />
        <a
          className='text-end font-mono text-gray-400'
          onClick={() => {
            toggleDirection()
            refetch()
          }}
        >
          ORDER:
          {`${orderField}-${orderDirection}`}
        </a>
        <a className='text-end font-mono text-gray-400'>
          TAGS:
          {tags.size}
        </a>
        <a className='text-end font-mono text-gray-400'>
          SHOWING:
          {contentList
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
      <div
        ref={contentContainer}
        className='relative isolate -z-10'
      >
        <ContentGrid
          ref={contentContainer}
          error={error}
        >
          {contentList?.pages?.map((page, pageIdx) => {
            if (Array.isArray(page)) {
              return
            }

            return page.content.map((content, contentIdx) => (
              <ContentPreview
                data-grid-groupkey={pageIdx}
                key={content.id}
                className={clsx(
                  'group/content',
                  config?.layoutMode === 'masonry' ? 'w-[16.6%]' : '',
                  config?.layoutMode === 'grid' ||
                    config?.layoutMode === 'experimental'
                    ? 'h-[10rem]'
                    : '',
                )}
                onClick={() => {
                  openContentModal(content)
                }}
                content={content}
                contentProps={{
                  className: 'cursor-pointer',
                }}
              >
                <TagColorThing
                  className='absolute inset-x-0 top-0 flex h-1 w-full flex-row group-hover/content:h-1.5'
                  tags={content.tags!}
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

                    const toBeMarked: number[] = MarkContent(
                      markerIdx.current,
                      pageIdx,
                      contentIdx,
                      contentList,
                    )

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
              </ContentPreview>
            ))
          })}
        </ContentGrid>
      </div>
      {isFetching && (
        <div className='flex items-center justify-center py-10'>
          <ArrowPathIcon className='h-6 w-6 animate-spin' />
        </div>
      )}
    </div>
  )
}

export {Main}
export default Main

const ContentGrid = forwardRef(function Body(
  {
    error,
    children,
    ...props
  }: {
    error: unknown
  } & PropsWithChildren &
    HTMLAttributes<HTMLDivElement> &
    HTMLAttributes<MasonryInfiniteGrid>,
  ref: Ref<MasonryInfiniteGrid> & Ref<HTMLDivElement>,
) {
  const {config} = useConfigStore()

  if (error) {
    return (
      <div
        {...props}
        ref={ref}
      >
        <h1 className='text-6xl'>{JSON.stringify(error)}</h1>
      </div>
    )
  }

  switch (config?.layoutMode) {
    case 'grid':
      return (
        <div
          {...props}
          ref={ref}
          className={clsx(
            'grid grid-flow-dense grid-cols-6 gap-2',
            props.className,
          )}
        >
          {children}
        </div>
      )
    case 'experimental':
      return (
        <div
          {...props}
          ref={ref}
          className='grid'
          style={{
            gridTemplateRows: 'repeat(auto-fill,minmax(10rem,2fr))',
            gridTemplateColumns: 'repeat(auto-fill,minmax(10rem,2fr))',
          }}
        >
          {children}
        </div>
      )
    case 'masonry':
      return (
        <MasonryInfiniteGrid
          ref={ref}
          resizeDebounce={1}
          maxResizeDebounce={1}
          useFirstRender={false}
          className={'w-full overflow-clip'}
          column={6}
        >
          {children}
        </MasonryInfiniteGrid>
      )
    default:
      return <></>
  }
})

function OptionsDropdown(props: {
  openEditTagsModal: (...any: any[]) => any
  openEditColorsModal: (...any: any[]) => any
  openOptionsModal: (...any: any[]) => any
}) {
  return (
    <Dropdown
      triggerRender={() => (
        <Cog8ToothIcon className='mb-1 ml-1 h-6 w-6 fill-gray-100 stroke-gray-600 transition-colors hover:fill-gray-300 hover:stroke-white' />
      )}
    >
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
      <div
        className='flex p-2 transition-colors hover:bg-gray-500 hover:text-white'
        onClick={props.openOptionsModal}
      >
        <span>OPTIONS</span>
      </div>
    </Dropdown>
  )
}
