import {useNavigate, useSearchParams} from 'react-router-dom'
import {useQuery} from '@tanstack/react-query'
import {HTMLAttributes, KeyboardEventHandler, useEffect, useState} from 'react'
import {InlineTag} from './components/InlineTag'
import {TaggerContent} from './components/TaggerContent'
import {Content} from 'src/main/src/db/models'
import clsx from 'clsx'
import {useToggle} from './hooks/useToggle'

function ContentModal({
  content: ContentParam,
  contentProps,
  onClose,
  ...props
}: {
  content?: Content
  contentProps: HTMLAttributes<HTMLDivElement>
  onClose: (...any: any[]) => any
} & HTMLAttributes<HTMLDivElement>): JSX.Element {
  const [showAddTagDropdown, toggleAddTagDropDown] = useToggle(false)
  const [fullscreen, toggleFullscreen] = useToggle(false)
  const containerClass = clsx(props.className)
  const navigate = useNavigate()

  useEffect(() => {
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
      }
    }
    addEventListener('keydown', hotkeysListener)
    return () => {
      removeEventListener('keydown', hotkeysListener)
    }
  }, [])

  const {
    data: content,
    error,
    isLoading,
  } = useQuery(
    ['DetailedContent'],
    async () => {
      if (!ContentParam || !ContentParam.id) return null

      const id = ContentParam?.id
      const result = await window.api.invokeOnMain('getDetailedImage', id)

      if (!result) {
        throw 'Invalid Image'
      }
      return result
    },
    {
      initialData: ContentParam,
    },
  )

  if (!ContentParam) return <></>

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
      {...props}
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
        <div className='relative'>
          <div className={'my-2'}>
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
          <div>
            {(content?.tags || []).map((tag) => {
              return (
                <InlineTag
                  key={tag.id}
                  tag={tag}
                />
              )
            })}
            <a
              onClick={() => {
                toggleAddTagDropDown(true)
              }}
              className={
                'ml-1 inline-flex animate-gradient_xy_fast rounded-full border-2 bg-gradient-to-tr from-fuchsia-400 via-cyan-400 to-green-400 p-1 px-1.5 text-center text-xl font-bold text-white text-opacity-90 backdrop-contrast-200 transition-all hover:bg-clip-text hover:text-transparent'
              }
            >
              +
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ContentModal
