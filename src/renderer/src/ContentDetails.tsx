import {useNavigate} from 'react-router-dom'
import {
  HTMLAttributes,
  PropsWithChildren,
  RefObject,
  useEffect,
  useMemo,
  useRef,
} from 'react'
import {InlineTag} from './components/InlineTag'
import {ShelfContent} from './components/ShelfContent'
import clsx from 'clsx'
import {useToggle} from './hooks/useToggle'
import {InlineButton} from './components/InlineButton'
import {useTagQuery} from './hooks/useTagQuery'
import {Dropdown} from './components/Dropdown'
import {
  DropdownMenuArrow,
  DropdownMenuItem,
  DropdownMenuProps,
} from '@radix-ui/react-dropdown-menu'
import {ArrowLeftIcon} from '@heroicons/react/24/solid'
import {checkExtension} from './utils/Extensions'
import {useContentQueryStore} from './hooks/useQueryStore'
import {useHotkeys} from './hooks/useHotkeys'
import {openContentDirectory, openInAnotherProgram} from './utils/Content'
import {useQuery, useQueryClient} from '@tanstack/react-query'

const prevTitle = window.document.title

type ContentDetailsProp = {
  contentInfo: {id: number} | null
  onClose: (...any: any[]) => any
} & HTMLAttributes<HTMLDivElement>

function ContentDetails({
  contentInfo,
  onClose,
  ...props
}: ContentDetailsProp): JSX.Element {
  const {value: fullscreen, toggle: toggleFullscreen} = useToggle(false)
  const containerClass = clsx(props.className, 'backdrop-blur-xl')
  const navigate = useNavigate()
  const modalRef = useRef<HTMLDivElement>(null)

  const {
    data: content,
    error,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['DetailedContent', contentInfo],
    queryFn: async () => {
      if (contentInfo === null) {
        return null
      }
      return window.api.invokeOnMain('getDetailedContent', contentInfo.id)
    },
  })

  const close = () => {
    onClose()
  }
  const {toggle: toggleHotkeys} = useHotkeys({
    Escape: close,
    f: toggleFullscreen,
    o: () => {
      openInAnotherProgram(content!)
    },
    d: () => {
      openContentDirectory(content!)
    },
  })

  useEffect(() => {
    if (!content) return
    window.document.title = `${prevTitle} - ${
      content?.paths?.at(0)?.path ?? 'Invalid Path'
    }`

    return () => {
      window.document.title = prevTitle
    }
  }, [content])

  const format = useMemo(
    () => (content ? checkExtension(content.extension) : 'unrecognized'),
    [content],
  )

  if (isLoading) {
    return <div className={clsx('backdrop-blur-xl', containerClass)}></div>
  } else if (!content || error) {
    return (
      <div
        className={containerClass}
        onClick={close}
      >
        <h1 onClick={() => navigate({pathname: '/'})}>{'ERROR -> ' + error}</h1>
      </div>
    )
  } else if (fullscreen && format === 'image') {
    return (
      <div className={clsx(containerClass, 'bg-black bg-opacity-50')}>
        <ShelfContent
          className={'h-full w-full bg-black bg-opacity-50 backdrop-blur-xl'}
          content={content}
          onClick={() => {
            toggleFullscreen()
          }}
        />
      </div>
    )
  }

  return (
    <div
      ref={modalRef}
      {...props}
      id={'taggerModal'}
      className={clsx(containerClass)}
    >
      <div className={clsx('flex flex-row items-center bg-gray-200 p-5')}>
        <ArrowLeftIcon
          className='h-6 w-6 align-middle transition-colors hover:stroke-white'
          onClick={close}
        />
      </div>
      <div onClick={() => toggleFullscreen()}>
        <ShelfContent
          className={clsx('h-[60vh] bg-black bg-opacity-50')}
          content={content}
        />
      </div>
      <div
        className={
          'max-h-full min-h-full overflow-y-auto bg-gray-200 px-4 pt-4'
        }
      >
        <div className={'my-2 flex flex-col'}>
          {(content?.paths || []).map((p, idx) => {
            return (
              <p
                key={idx}
                className='trucate selectableText overflow-hidden font-mono font-medium selection:bg-fuchsia-400'
              >
                {p.path}
              </p>
            )
          })}
        </div>
        <div className='flex flex-row flex-wrap'>
          {(content?.tags || []).map((tag) => {
            return (
              <InlineTagDropdown
                key={tag.id}
                onClose={onClose}
                modalRef={modalRef}
                tagId={tag.id}
                removeTag={async () => {
                  await window.api.invokeOnMain('removeTagfromContent', {
                    contentId: content.id,
                    tagId: tag.id,
                  })
                  refetch()
                }}
              />
            )
          })}
          <AddTagDropdown
            modalRef={modalRef}
            onOpenChange={(open) => {
              toggleHotkeys(!open)
            }}
            addTag={async (tag) => {
              await window.api.invokeOnMain('addTagToContent', {
                contentId: content.id,
                tagId: tag,
              })
              refetch()
            }}
          >
            {'+ ADD'}
          </AddTagDropdown>
        </div>
      </div>
    </div>
  )
}

export const InlineTagDropdown = ({
  removeTag,
  onClose,
  tagId,
  modalRef,
  ...props
}: {
  removeTag: (tagId: number) => any
  onClose: (...any: any[]) => any
  tagId: number
  modalRef: RefObject<HTMLDivElement>
} & DropdownMenuProps) => {
  const addQuery = useContentQueryStore((s) => s.addQuery)

  return (
    <Dropdown
      {...props}
      triggerRender={() => <InlineTag tagId={tagId} />}
      modalRef={modalRef}
    >
      <DropdownMenuArrow className='fill-white' />
      <DropdownMenuItem
        className='select-none p-4 outline-none transition-colors hover:bg-gray-500 hover:text-white'
        onClick={() => {
          addQuery({field: 'tag', value: tagId, operation: 'include'})
          onClose()
        }}
      >
        Search
      </DropdownMenuItem>
      <DropdownMenuItem
        className='select-none p-4 outline-none transition-colors hover:bg-gray-500 hover:text-white'
        onClick={() => removeTag(tagId)}
      >
        Remove
      </DropdownMenuItem>
    </Dropdown>
  )
}

export const AddTagDropdown = ({
  addTag,
  modalRef,
  ...props
}: {
  addTag: (tagId: number) => any
  modalRef: RefObject<HTMLDivElement>
} & PropsWithChildren &
  DropdownMenuProps) => {
  const {query, setQuery, foundTags} = useTagQuery()

  return (
    <Dropdown
      {...props}
      modalRef={modalRef}
      contentClass={clsx('p-2')}
      triggerRender={() => {
        return <InlineButton>{'+ ADD'}</InlineButton>
      }}
    >
      <DropdownMenuArrow className='fill-white' />
      <div
        className={
          'group relative flex max-h-[30vh] select-none flex-col items-center overflow-y-scroll p-2 text-sm'
        }
      >
        {foundTags.map((tag) => {
          return (
            <InlineTag
              key={tag}
              tagId={tag}
              onClick={() => {
                addTag(tag)
              }}
            />
          )
        })}
      </div>
      <input
        type='text'
        className='mt-4 w-full rounded-md p-2 outline-none ring ring-gray-300'
        value={query}
        onClick={(evt) => {
          evt.stopPropagation()
        }}
        onChange={(evt) => {
          evt.stopPropagation()
          setQuery(evt.target.value)
        }}
      />
    </Dropdown>
  )
}

export {ContentDetails}
