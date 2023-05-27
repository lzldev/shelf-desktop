import Versions from './components/Versions'
import {useConfigStore} from './hooks/useConfig'
import {ReactComponent as Logo} from './assets/logo.svg'
import {CornerThing} from './components/CornerThing'

function Start(): JSX.Element {
  const {config} = useConfigStore()

  const openDialog = async (dir: 'openFile' | 'openDirectory') => {
    const dialog = await window.api.invokeOnMain('openDialog', {
      dialogType: dir,
    })
    if (dialog.canceled || dialog.filePaths.length === 0) return

    await window.api.invokeOnMain('startTaggerClient', dialog.filePaths[0])
  }

  return (
    <div className='relative flex h-screen w-full flex-col overflow-hidden bg-background'>
      <CornerThing />
      <div className='bg-surface'>
        <Logo className='mx-auto my-10' />
        <div className='flex flex-row divide-x-4 divide-black border-b-4 border-black text-center font-mono'>
          <div
            className='flex-1 cursor-pointer justify-center p-2 transition-all duration-50  hover:bg-gray-100'
            onClick={() => openDialog('openDirectory')}
          >
            <h1>NEW DIRECTORY</h1>
          </div>
          <div
            className='flex-1 cursor-pointer items-center justify-center p-2 transition-all duration-50 hover:bg-gray-100'
            onClick={() => openDialog('openFile')}
          >
            OPEN
          </div>
        </div>
      </div>
      <div className='flex h-1 grow flex-col overflow-y-auto text-sm font-bold'>
        {Array.from(new Set(config?.recentFiles).values()).map(
          (recentPath, idx) => (
            <h1
              key={idx}
              className='recentPath  hover:bg-sky-200'
              onClick={() => {
                window.api.invokeOnMain('startTaggerClient', recentPath)
              }}
            >
              {recentPath}
            </h1>
          ),
        )}
      </div>
      <Versions />
    </div>
  )
}

export {Start}
