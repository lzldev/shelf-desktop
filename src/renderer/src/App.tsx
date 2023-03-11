import Versions from './components/Versions'
import icons from './assets/icons.svg'
import { PropsWithChildren, useEffect, useState } from 'react'
import { useProgress } from './hooks/useProgress'
import { useTags } from './hooks/useTags'
import { Tag, Content } from 'src/main/src/db/models'

function App(): JSX.Element {
  const { tags } = useTags()
  const [files, setFiles] = useState<Content[]>([])
  const [selected, setSelected] = useState<Set<Tag>>(new Set())
  const [error, setError] = useState<string | undefined>()
  const [isLoading, setIsLoading] = useState<boolean>(true)

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
      <div className='grid w-auto grid-cols-4'>
        {isLoading ? (
          <h1 className='col-span-full text-center text-9xl'>LOADING</h1>
        ) : (
          files.map((value) => {
            if (!value.paths || !value.paths[0]) {
              return
            }

            const url = new URL(value.paths[0].path)
            url.protocol = 'tagger:'

            return (
              <div key={value.id} className='p-4'>
                {value.extension === '.mp4' ? (
                  <video
                    className='h-full border-2 border-red-500 bg-black bg-opacity-20 object-contain'
                    src={url.toString()}
                    muted={true}
                    onClick={(evt) => {
                      const videoPlayer = evt.currentTarget
                      videoPlayer.paused
                        ? videoPlayer.play()
                        : videoPlayer.pause()
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
                ) : (
                  <img
                    className='h-full bg-black bg-opacity-5 object-contain'
                    src={'tagger://' + value.paths[0].path}
                  />
                )}
                <a className='truncate text-clip  underline'>
                  {value.paths[0].path}
                </a>
                <a className='truncate text-clip underline'>
                  {value.extension}
                </a>
              </div>
            )
          })
        )}
      </div>
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
      <form className='mb-5 flex w-full place-content-stretch  border-red-500 bg-white align-middle ring'>
        <input
          className='
           w-full bg-transparent
           p-2 text-pink-500 outline-none 
           ring-pink-500
           selection:bg-pink-200
           hover:border-none focus:ring-2 active:border-none'
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
          className=' bg-red-100 px-10 font-bold hover:ring'
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
              className='p2 mx-2 my-1 inline-block hover:underline'
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
      <div className='my-2 bg-gray-200'>
        {selectedTags.map((tag) => {
          return (
            <a
              key={tag.id}
              onClick={() => {
                removeSelected(tag)
              }}
              className='m-1 inline-block animate-gradient_xy rounded-full bg-gradient-to-tl
               from-fuchsia-400 to-cyan-400  p-1.5  font-bold text-white text-opacity-90'
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
