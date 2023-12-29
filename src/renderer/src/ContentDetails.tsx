import {PropsWithChildren, useEffect, useMemo, useRef} from 'react'
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
import {openContentDirectory, openInAnotherProgram} from './utils/Path'
import {useQuery} from '@tanstack/react-query'
import {ColorfulFilePath} from './components/ColorfulFilePath'

const prevTitle = window.document.title

type ContentDetailsProp = {
  contentInfo: {id: number} | null
  onClose: (...any: any[]) => any
}

function ContentDetails({
  contentInfo,
  onClose,
}: ContentDetailsProp): JSX.Element {
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

  const {value: fullscreen, toggle: toggleFullscreen} = useToggle(false)
  const modalRef = useRef<HTMLDivElement>(null)

  const {toggle: toggleHotkeys} = useHotkeys({
    Escape: onClose,
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

  const containerClass = clsx(
    'text-6 fixed inset-0 w-full backdrop-blur-xl bg-opacity-30 flex flex-col min-h-screen overflow-y-auto',
  )

  if (isLoading) {
    return <div className={containerClass}></div>
  }

  if (!content || error) {
    return (
      <div
        className={containerClass}
        onClick={onClose}
      >
        <h1 onClick={onClose}>{'ERROR -> ' + error}</h1>
      </div>
    )
  }

  if (fullscreen && format === 'image') {
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
      id={'taggerModal'}
      className={clsx(containerClass)}
    >
      <div className={clsx('flex flex-row items-center bg-gray-200 p-5')}>
        <ArrowLeftIcon
          className='w-6 h-6 align-middle transition-colors hover:stroke-white'
          onClick={onClose}
        />
      </div>
      <div onClick={() => toggleFullscreen()}>
        <ShelfContent
          className={clsx('h-[60vh] bg-black bg-opacity-50')}
          content={content}
        />
      </div>
      <div className={'flex flex-grow flex-col bg-gray-200'}>
        <div className='flex flex-row flex-wrap px-2 py-4'>
          {(typeof content.tags !== 'string' && content?.tags
            ? content.tags
            : null ?? []
          ).map((tag) => {
            return (
              <InlineTagDropdown
                key={tag.id}
                onClose={onClose}
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
          />
        </div>
        <div
          className={
            'flex flex-col border-y-2 border-neutral-500 bg-neutral-800 px-4 py-2 font-mono text-white'
          }
        >
          {(content?.paths || []).map((p, idx) => (
            <ColorfulFilePath
              key={p.path + idx}
              path={p.path}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

type InlineTagDropdownProps = {
  removeTag: (tagId: number) => any
  onClose: (...any: any[]) => any
  tagId: number
} & DropdownMenuProps

export const InlineTagDropdown = ({
  removeTag,
  onClose,
  tagId,
}: InlineTagDropdownProps) => {
  const addQuery = useContentQueryStore((s) => s.addQuery)

  return (
    <Dropdown triggerRender={() => <InlineTag tagId={tagId} />}>
      <DropdownMenuArrow className='fill-white' />
      <DropdownMenuItem
        className='p-4 transition-colors outline-none select-none hover:bg-gray-500 hover:text-white'
        onClick={() => {
          addQuery({field: 'tag', value: tagId, operation: 'include'})
          onClose()
        }}
      >
        Search
      </DropdownMenuItem>
      <DropdownMenuItem
        className='p-4 transition-colors outline-none select-none hover:bg-gray-500 hover:text-white'
        onClick={() => removeTag(tagId)}
      >
        Remove
      </DropdownMenuItem>
    </Dropdown>
  )
}

type AddTagDropdownProps = {
  addTag: (tagId: number) => any
} & PropsWithChildren &
  DropdownMenuProps

export const AddTagDropdown = ({addTag}: AddTagDropdownProps) => {
  const {query, setQuery, foundTags} = useTagQuery()

  return (
    <Dropdown
      contentClass={'p-2'}
      triggerRender={() => {
        return <InlineButton>+ ADD</InlineButton>
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
        className='w-full p-2 mt-4 rounded-md outline-none ring ring-gray-300'
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
