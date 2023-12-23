import Versions from './components/Versions'
import {useConfigStore} from './hooks/useConfig'
import {ReactComponent as Logo} from './assets/logo.svg'
import {CornerThing} from './components/CornerThing'
import {FolderOpenIcon} from '@heroicons/react/20/solid'
import {ShelfClientConfig} from 'src/main/ShelfConfig'
import {useState} from 'react'
import {Mutable} from 'src/types/utils'
import {useImmer} from 'use-immer'
import {twc} from 'react-twc'

const HeadButton = twc.div`flex justify-center align-middle py-2 w-full font-mono font-bold cursor-pointer group/button bg-surface hover:bg-gray-100`

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

  const showConfig = !!selectedPaths

  return (
    <div className='relative flex flex-col w-full h-screen overflow-hidden bg-background'>
      <CornerThing />
      <div className='flex flex-col items-center pt-10 bg-surface gap-y-10'>
        <Logo />
        {!showConfig && (
          <HeadButton onClick={openDirectoryDialog}>
            <FolderOpenIcon className='self-center w-6 h-6 mr-1' />
            <span>Open</span>
          </HeadButton>
        )}
        {showConfig && (
          <HeadButton
            onClick={() => {
              setSelectedPaths(undefined)
            }}
          >
            <span>Close</span>
          </HeadButton>
        )}
      </div>
      <div className='flex flex-col flex-grow overflow-y-auto font-mono text-sm font-bold'>
        <StartBody
          showConfig={showConfig}
          filePath={selectedPaths?.at(0)}
        />
      </div>
      <Versions />
    </div>
  )
}

type StartBodyProps = {
  showConfig: boolean
  filePath: string | undefined
}

function StartBody(props: StartBodyProps) {
  const {showConfig, filePath} = props

  if (showConfig) {
    return <StartingOptions base={filePath!} />
  } else {
    return <RecentFiles />
  }
}

function RecentFiles() {
  const {config, setConfig, saveConfig} = useConfigStore()

  return (
    <>
      {config?.recentFiles.map((recentPath, idx) => (
        <p
          key={idx}
          className='px-2 py-0.5 hover:bg-sky-200 md:text-center'
          onClick={async () => {
            const info = await window.api.invokeOnMain(
              'checkDirectory',
              recentPath,
            )

            if (!info.exists) {
              const old = config.recentFiles
              old.splice(old.indexOf(recentPath), 1)
              setConfig({recentFiles: old})
              saveConfig()
              return
            }
            window.api.invokeOnMain('startShelfClient', {basePath: recentPath})
          }}
        >
          {recentPath}
        </p>
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
    aiWorker: false,
  })

  return (
    <>
      <HeadButton>
        <span className='mt-1 text'>START</span>
      </HeadButton>
      <div className='relative flex flex-col w-full h-screen px-10 pt-2 overflow-hidden bg-background'>
        <div className='flex flex-row justify-between mb-1'>
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
            <label>Ignore Hidden</label>
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
        <span>Additional Paths</span>

        <div className='min-h-[6rem] w-full overflow-y-scroll bg-white'>
          {startConfig?.additionalPaths.map((p, idx) => (
            <div
              className='flex group/path hover:bg-gray-200'
              key={idx}
            >
              <span className='flex self-center grow text-start'>{p}</span>
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
          className='p-1 cursor-pointer ring-1 ring-neutral-400 hover:bg-neutral-400 hover:text-white'
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
        <div
          className='flex flex-row w-full text-xl text-center'
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
    </>
  )
}
