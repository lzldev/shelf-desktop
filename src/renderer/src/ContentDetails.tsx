import {useNavigate} from 'react-router-dom'
import {useQuery} from '@tanstack/react-query'
import {
  HTMLAttributes,
  PropsWithChildren,
  RefObject,
  useEffect,
  useRef,
} from 'react'
import {InlineTag} from './components/InlineTag'
import {TaggerContent} from './components/TaggerContent'
import {Content, Tag} from 'src/main/src/db/models'
import clsx from 'clsx'
import {useToggle} from './hooks/useToggle'
import {InlineButton} from './components/InlineButton'
import {useTagQuery} from './hooks/useTagQuery'
import {PageHeader} from './components/PageHeader'
import {Dropdown} from './components/Dropdown'
import {
  DropdownMenuArrow,
  DropdownMenuItem,
  DropdownMenuProps,
} from '@radix-ui/react-dropdown-menu'

const prevTitle = window.document.title

function ContentDetails({
  content: contentProp,
  contentProps,
  onClose,
  onNext,
  onPrevious,
  ...props
}: {
  content?: Content
  contentProps: HTMLAttributes<HTMLDivElement>
  onClose: (...any: any[]) => any
  onNext: (...any: any[]) => any
  onPrevious: (...any: any[]) => any
} & HTMLAttributes<HTMLDivElement>): JSX.Element {
  const [hotkeys, toggleHotkeys] = useToggle(true)
  const [fullscreen, toggleFullscreen] = useToggle(false)
  const containerClass = clsx(props.className)
  const navigate = useNavigate()
  const modalRef = useRef<HTMLDivElement>(null)

  const {
    data: content,
    error,
    isLoading,
    refetch,
  } = useQuery(
    ['DetailedContent'],
    async () => {
      if (!contentProp || !contentProp.id) return null

      const id = contentProp?.id
      const result = await window.api.invokeOnMain('getDetailedImage', id)

      if (!result) {
        return null
      }
      return result
    },
    {
      initialData: contentProp,
    },
  )

  useEffect(() => {
    if (!hotkeys || !content) return
    const hotkeysListener = (evt: KeyboardEvent) => {
      switch (evt.key) {
        case 'Escape': {
          onClose()
          break
        }
        case 'f': {
          toggleFullscreen()
          break
        }
        case 'o': {
          if (content) {
            window.open('file://' + content?.paths[0].path)
          }
          break
        }
        case 'd': {
          if (content) {
            //TODO: MOVE THIS ELSEWHERE
            window.open(
              'file://' +
                content?.paths[0].path.substring(
                  0,
                  content?.paths[0].path.lastIndexOf('\\'),
                ),
            )
          }
          break
        }
        case 'ArrowRight': {
          onNext()
          break
        }
        case 'ArrowLeft': {
          onPrevious()
          break
        }
      }
    }

    addEventListener('keydown', hotkeysListener)
    return () => {
      removeEventListener('keydown', hotkeysListener)
    }
  }, [hotkeys, content])

  useEffect(() => {
    if (!content) return
    window.document.title = `${prevTitle} - ${content?.paths[0]?.path}`
    return () => {
      window.document.title = prevTitle
    }
  }, [content])

  if (isLoading) {
    return (
      <div className={containerClass}>
        <h1 onClick={() => navigate({pathname: '/'})}>LOADING</h1>
        <h1 onClick={() => navigate('/')}>{window.location.toString()}</h1>
      </div>
    )
  }

  if (!content || error) {
    return (
      <div className={containerClass}>
        <h1 onClick={() => navigate({pathname: '/'})}>{'ERROR -> ' + error}</h1>
      </div>
    )
  }

  if (fullscreen) {
    return (
      <div className={clsx(containerClass, 'bg-black bg-opacity-50')}>
        <TaggerContent
          className={'h-full w-full'}
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
      className={containerClass}
    >
      <PageHeader onClose={onClose} />
      <div onClick={() => toggleFullscreen()}>
        <TaggerContent
          {...contentProps}
          className={clsx('h-[60vh]', contentProps.className)}
          content={content}
        />
      </div>
      <div
        className={
          'max-h-full min-h-full overflow-y-auto bg-gray-200 px-4 pt-4'
        }
      >
        {/* <div className={'float-right flex flex-row-reverse'}>
          <InlineButton>Open Directory</InlineButton>
          <InlineButton>Open File</InlineButton>
        </div> */}
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
                modalRef={modalRef}
                tag={tag}
                removeTag={async (tag: Tag) => {
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
                tagId: tag.id,
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
  tag,
  modalRef,
  ...props
}: {
  removeTag: (tag: Tag) => any
  tag: Tag
  modalRef: RefObject<HTMLDivElement>
} & DropdownMenuProps) => {
  return (
    <Dropdown
      {...props}
      triggerRender={() => <InlineTag tag={tag} />}
      modalRef={modalRef}
    >
      <DropdownMenuArrow className='fill-white' />
      <DropdownMenuItem
        className='select-none p-4 outline-none transition-colors hover:bg-gray-500 hover:text-white'
        onClick={() => removeTag(tag)}
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
  addTag: (tag: Tag) => any
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
              key={tag.id}
              tag={tag}
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

export default ContentDetails
