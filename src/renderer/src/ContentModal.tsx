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
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import {useTagQuery} from './hooks/useTagQuery'

function ContentModal({
  content: contentProp,
  contentProps,
  onClose,
  ...props
}: {
  content?: Content
  contentProps: HTMLAttributes<HTMLDivElement>
  onClose: (...any: any[]) => any
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
    isFetched,
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
      }
    }

    addEventListener('keydown', hotkeysListener)
    return () => {
      removeEventListener('keydown', hotkeysListener)
    }
  }, [hotkeys, content])

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
      <div className='flex justify-between  bg-gray-200 p-5'>
        <h1
          className='font-mono text-6xl font-extrabold'
          onClick={onClose}
        >
          {'<-'}
        </h1>
      </div>
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
        <div className='float-right flex flex-row-reverse'>
          <InlineButton>Open Directory</InlineButton>
          <InlineButton>Open File</InlineButton>
        </div>
        <div className={'my-2 flex flex-col'}>
          {(content?.paths || []).map((p, idx) => {
            return (
              <p
                key={idx}
                className='trucate selectable overflow-hidden font-mono font-medium selection:bg-fuchsia-400'
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
} & DropdownMenu.DropdownMenuProps) => {
  return (
    <DropdownMenu.Root
      {...props}
      modal={false}
    >
      <DropdownMenu.Trigger className='outline-none'>
        <InlineTag tag={tag} />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal container={modalRef.current}>
        <DropdownMenu.Content className='rounded-md bg-white shadow-md'>
          <DropdownMenu.Arrow className='fill-white' />
          <DropdownMenu.Item
            className='select-none p-4 outline-none transition-colors hover:bg-gray-500 hover:text-white'
            onClick={() => removeTag(tag)}
          >
            Remove
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
export const AddTagDropdown = ({
  children,
  addTag,
  modalRef,
  ...props
}: {
  addTag: (tag: Tag) => any
  modalRef: RefObject<HTMLDivElement>
} & PropsWithChildren &
  DropdownMenu.DropdownMenuProps) => {
  const {query, setQuery, foundTags} = useTagQuery()

  return (
    <DropdownMenu.Root
      {...props}
      modal={false}
    >
      <DropdownMenu.Trigger className='outline-none'>
        <InlineButton>{children}</InlineButton>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal container={modalRef.current}>
        <DropdownMenu.Content className='min-w-full rounded-md bg-white p-2 shadow-md'>
          <DropdownMenu.Arrow className='fill-white' />
          <div className='group relative flex max-h-[30vh] select-none flex-col items-center overflow-y-scroll p-2 text-sm'>
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
          <DropdownMenu.Separator />
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

export default ContentModal
