import {PropsWithChildren, useState} from 'react'
import {useTags} from './hooks/useTags'
import {Tag, Content} from 'src/main/src/db/models'
import {createSearchParams, useNavigate} from 'react-router-dom'
import {useQuery} from '@tanstack/react-query'
import {InlineTag} from './components/InlineTag'

function App(): JSX.Element {
  const {tags} = useTags()
  const [selected, setSelected] = useState<Set<Tag>>(new Set())
  const navigate = useNavigate()

  const getImages = async () => {
    const tags = selected.size > 0 ? Array.from(selected.values()) : undefined
    const Files = await window.api.invokeOnMain('getTaggerImages', {
      tags,
    })

    if (Files) {
      return Files
    }

    throw 'Content Not Found'
  }

  const {
    data: files,
    error,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['content'],
    queryFn: getImages,
  })

  return (
    <div className='min-h-screen w-full p-10'>
      <div>
        <Query
          tags={tags}
          selected={selected}
          onQuery={refetch}
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
      </div>
      <Body
        isLoading={isLoading}
        error={error}
      >
        {(files || []).map((content) => {
          if (!content.paths || !content.paths[0]) {
            return
          }

          return (
            <div
              key={content.id}
              className={'grid-flow-col overflow-hidden p-4'}
              onClick={() => {
                navigate({
                  pathname: 'content',
                  search: createSearchParams({
                    id: content.id,
                  }).toString(),
                })
              }}
            >
              <div className={'flex h-full flex-col'}>
                <TaggerFile content={content} />
                <a className={'inline-flex'}>{content.paths[0].path}</a>
              </div>
            </div>
          )
        })}
      </Body>
    </div>
  )
}

const Body = (
  props: {isLoading: boolean; error: unknown} & PropsWithChildren,
) => {
  if (props.error) {
    return (
      <div
        className={
          'grid w-auto sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8'
        }
      >
        <h1 className='text-6xl'>{props.error.toString()}</h1>
      </div>
    )
  }
  return (
    <div className='grid w-auto sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8'>
      {props.isLoading ? <></> : props.children}
    </div>
  )
}

const TaggerFile = (props: {content: Content}) => {
  const {content} = props
  const [hidden, setHidden] = useState(true)

  if (content.extension === '.mp4') {
    return (
      <video
        className='flex-auto border-2 bg-black bg-opacity-20'
        src={'tagger://' + content.paths[0].path}
        muted={true}
        onClick={(evt) => {
          const videoPlayer = evt.currentTarget
          videoPlayer.paused ? videoPlayer.play() : videoPlayer.pause()
          videoPlayer.muted
            ? (videoPlayer.muted = true)
            : (videoPlayer.muted = false)
        }}
        onMouseOut={(evt) => {
          evt.currentTarget.pause()
        }}
        onMouseEnter={(evt) => {
          if (evt.currentTarget.paused) {
            evt.currentTarget.play()
          }
        }}
      />
    )
  }

  return (
    <div
      className={
        'flex h-full' +
        (hidden
          ? ' animate-gradient_x bg-gradient-to-r from-gray-600 to-gray-500 opacity-50'
          : '')
      }
    >
      <img
        className={
          'flex-auto object-contain transition-all' +
          (hidden ? 'bg-gradient-to-tr opacity-0' : '')
        }
        onLoad={() => {
          setHidden(false)
        }}
        src={'tagger://' + content.paths[0].path}
      />
    </div>
  )
}

export const Query = (props: {
  tags: Tag[]
  selected: Set<Tag>
  onQuery: () => any
  addSelected: (tag: Tag) => any
  removeSelected: (tag: Tag) => any
  hidden?: boolean
}) => {
  const {tags, onQuery, addSelected, selected, removeSelected} = props
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

  if (props.hidden === true) {
    return <></>
  }

  return (
    <div className='relative'>
      <form
        className={
          'z-20 mb-5 flex w-full place-content-stretch overflow-clip rounded-full bg-white ring ring-pink-500'
        }
      >
        <input
          className={
            ' z-20 w-full bg-transparent p-2 text-pink-500 outline-none selection:bg-pink-200 hover:border-none active:border-none'
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
            'z-20 bg-gradient-to-r from-pink-500 to-cyan-600 bg-clip-text px-10 font-bold text-transparent text-gray-700 ring-gray-300 hover:bg-clip-border hover:text-white hover:ring-0'
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
            text-gray-700 underline decoration-pink-500 
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
        className='-mx-10 bg-gray-200 px-10 py-2'
        hidden={selectedTags.length === 0}
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

export default App
