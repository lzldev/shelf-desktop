import Versions from './components/Versions'
import {useConfigStore} from './hooks/useConfig'
import {ReactComponent as Logo} from './assets/logo.svg'
import {CornerThing} from './components/CornerThing'
import {FolderOpenIcon} from '@heroicons/react/20/solid'
import {ShelfClientConfig} from 'src/main/ShelfConfig'
import {useState} from 'react'
import {Mutable} from 'src/types/utils'
import {useImmer} from 'use-immer'

export default function Start() {
  const [selectedPaths, setSelectedPaths] = useState<string[]>()

  const openDirectoryDialog = async () => {
    const dialog = await window.api.invokeOnMain('openDirectory')

    if (dialog.canceled || dialog.filePaths.length === 0) return

    if (!dialog.isNew) {
      window.api.invokeOnMain('startShelfClient', {
        basePath: dialog.filePaths[0],
      })
      return
    }

    setSelectedPaths(dialog.filePaths)
  }

  const showConfig = !selectedPaths

  return (
    <div className='relative flex h-screen w-full flex-col overflow-hidden bg-background'>
      <CornerThing />
      <div className='bg-surface'>
        <Logo className='mx-auto my-10' />
        <div
          className='group/button flex cursor-pointer flex-row justify-center bg-surface py-2 font-mono font-bold transition-all duration-50 hover:bg-gray-100'
          onClick={
            showConfig
              ? openDirectoryDialog
              : () => {
                  setSelectedPaths(undefined)
                }
          }
        >
          {showConfig ? (
            <FolderOpenIcon className='mr-1 h-6 w-6 self-center' />
          ) : (
            <></>
          )}
          <span className='text -md mt-1'>
            {!selectedPaths ? 'OPEN' : 'BACK'}
          </span>
        </div>
      </div>
      <div className='flex grow flex-col overflow-y-auto font-mono text-sm font-bold'>
        {showConfig ? (
          <RecentFiles />
        ) : (
          <StartingOptions base={selectedPaths[0]} />
        )}
      </div>
      <Versions />
    </div>
  )
}

function RecentFiles() {
  const {config} = useConfigStore()

  return (
    <>
      {config?.recentFiles.map((recentPath, idx) => (
        <h1
          key={idx}
          className='px-2 py-0.5 first:pt-1 hover:bg-sky-200'
          onClick={() => {
            window.api.invokeOnMain('startShelfClient', {basePath: recentPath})
          }}
        >
          {recentPath}
        </h1>
      ))}
    </>
  )
}

function StartingOptions(props: {base: string}) {
  const [startConfig, setStartConfig] = useImmer<Mutable<ShelfClientConfig>>({
    additionalPaths: [],
    ignoredPaths: [],
    ignoreHidden: false,
    ignoreUnsupported: true,
    //TODO: Change this to true before release
    aiWorker: false,
  })

  return (
    <div className='relative flex h-screen w-full flex-col overflow-hidden bg-background px-10 pt-2'>
      <div className='mb-1 flex flex-row justify-between'>
        <div className='flex flex-row'>
          <input
            className='mr-1'
            type='checkbox'
            checked={startConfig.ignoreHidden}
            onChange={() => {
              setStartConfig((daft) => {
                daft.ignoreHidden = !daft.ignoreHidden
              })
            }}
          />
          <span>Ignore Hidden</span>
        </div>
        <div className='flex flex-row'>
          <input
            className='mr-1'
            type='checkbox'
            checked={startConfig.ignoreUnsupported}
            onChange={() => {
              setStartConfig((daft) => {
                daft.ignoreUnsupported = !daft.ignoreUnsupported
              })
            }}
          />
          <span>Ignore Unsupported Files</span>
        </div>
      </div>
      <span>Additional Paths:</span>
      <div
        onClick={async () => {
          const newPath = await window.api.invokeOnMain('openDialog')
          if (newPath.canceled) {
            return
          }

          setStartConfig((draft) => {
            draft.additionalPaths.push(...newPath.filePaths)
          })
        }}
      >
        Add Directory
      </div>
      <div className='min-h-[6rem] w-full overflow-y-scroll bg-white'>
        {startConfig?.additionalPaths.map((p, idx) => (
          <div
            className='group/path flex hover:bg-gray-200'
            key={idx}
          >
            <span className='flex grow self-center text-start'>{p}</span>
            <span
              className='pointer-events-auto flex px-2 py-0.5 font-mono font-bold hover:bg-red-500'
              onClick={() => {
                setStartConfig((draft) => {
                  draft.additionalPaths.splice(idx, 1)
                })
              }}
            >
              X
            </span>
          </div>
        ))}
      </div>
      <div
        className='flex w-full flex-row text-center text-xl'
        onClick={() => {
          window.api.invokeOnMain('startShelfClient', {
            config: startConfig,
            basePath: props.base,
          })
        }}
      >
        START
      </div>
    </div>
  )
}
