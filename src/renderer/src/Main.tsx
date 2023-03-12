import { useEffect, useState } from 'react'
import { useTags } from './hooks/useTags'
import { Tag, Content } from 'src/main/src/db/models'
import { createSearchParams, useNavigate } from 'react-router-dom'

function App(): JSX.Element {
  const { tags } = useTags()
  const [files, setFiles] = useState<Content[]>([])
  const [selected, setSelected] = useState<Set<Tag>>(new Set())
  const [error, setError] = useState<string | undefined>()
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const navigate = useNavigate()

  const getImages = async () => {
    setIsLoading(true)

    const tags = selected.size > 0 ? Array.from(selected.values()) : undefined

    const Files = await window.api
      .invokeOnMain('getTaggerImages', {
        tags,
      })
      .catch(setError)
    if (Files) {
      setFiles(() => Files)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    getImages()
  }, [])

  return (
    <div className='max-w-screen overflow-hidden p-10'>
      <Query
        tags={tags}
        selected={selected}
        onQuery={getImages}
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
      <div className='grid w-auto sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8'>
        {isLoading ? (
          <h1 className='col-span-full text-center text-9xl'></h1>
        ) : (
          files.map((value) => {
            if (!value.paths || !value.paths[0]) {
              return
            }

            const uri = new URL(value.paths[0].path)
            uri.protocol = 'tagger:'

            return (
              <div
                key={value.id}
                className='grid-flow-col overflow-hidden p-4'
                onClick={() => {
                  console.log(value.id)
                  navigate({
                    pathname: 'content',
                    search: createSearchParams({
                      id: value.id,
                    }).toString(),
                  })
                }}
              >
                <div className='w-full'>
                  <TaggerFile content={value} />
                  <a className='trucate overflow-hidden '>
                    {value.paths[0].path}
                  </a>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

const TaggerFile = (props: { content: Content }) => {
  const { content } = props
  const [hidden, setHidden] = useState(true)

  if (content.extension === '.mp4') {
    return (
      <video
        className='h-full border-2 border-red-500 bg-black bg-opacity-20'
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
        hidden
          ? 'animate-gradient_x bg-gradient-to-r from-gray-600 to-gray-500 opacity-50'
          : ''
      }
    >
      <img
        className={
          'h-full flex-auto object-contain transition-all' +
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

const Query = (props: {
  tags: Tag[]
  selected: Set<Tag>
  onQuery: () => any
  addSelected: (tag: Tag) => any
  removeSelected: (tag: Tag) => any
}) => {
  const { tags, onQuery, addSelected, selected, removeSelected } = props
  const [query, setQuery] = useState<string>('')
  const selectedTags = Array.from(selected)
  const TransformedQuery = query?.split(' ')
  const hideDrop = !!TransformedQuery[TransformedQuery.length - 1]
  const DropTags = hideDrop
    ? tags.filter((tag) =>
        tag.name
          .toLowerCase()
          .includes(
            TransformedQuery[TransformedQuery.length - 1].toLowerCase(),
          ),
      )
    : []

  return (
    <>
      <form
        className='mb-5 flex w-full 
        place-content-stretch overflow-clip
        rounded-xl
      bg-white align-middle ring ring-pink-500'
      >
        <input
          className='
           w-full bg-transparent
           p-2 text-pink-500 outline-none 
           selection:bg-pink-200
           hover:border-none active:border-none'
          type={'text'}
          value={query}
          list='tag-list'
          onChange={(evt) => {
            evt.preventDefault()
            setQuery(evt.target.value)
          }}
          onKeyDown={(evt) => {
            if (evt.key === 'Enter') {
              onQuery()
            }
          }}
        />
        <button
          className=' bg-red-100 px-10 font-bold 
          text-gray-700 
          ring-gray-300 hover:ring'
          onClick={onQuery}
        >
          Search
        </button>
      </form>
      <div
        className={'border-x-2 border-b-2 border-black bg-white'}
        hidden={!hideDrop}
      >
        {DropTags.map((tag) => {
          return (
            <a
              key={tag.id}
              className='p2 mx-2 my-1  inline-block 
              text-gray-700 underline decoration-pink-500 hover:decoration-fuchsia-700 hover:decoration-2'
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
      <div className='my-2'>
        {selectedTags.map((tag) => {
          return (
            <a
              key={tag.id}
              onClick={() => {
                removeSelected(tag)
              }}
              className='m-1 inline-block animate-gradient_xy rounded-full bg-gradient-to-tl
               from-fuchsia-400 to-cyan-400  p-1.5  font-bold text-opacity-90'
            >
              {tag.name}
            </a>
          )
        })}
      </div>
    </>
  )
}

export default App
