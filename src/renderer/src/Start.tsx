import Versions from './components/Versions'
import {useConfigStore} from './hooks/useConfig'
import {ReactComponent as Logo} from './assets/logo.svg'
import {CornerThing} from './components/CornerThing'
import {OpenDirectory} from './components/Icons'

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
        <div
          className='group/button flex cursor-pointer flex-row justify-center bg-surface p-2 font-mono font-bold transition-all duration-50 hover:bg-gray-100'
          // onClick={() => openDialog('openDirectory')}
          onClick={() => openDialog('openFile')}
        >
          <OpenDirectory className='mr-1 transition-all' />
          OPEN
        </div>
      </div>
      <div className='flex grow flex-col overflow-y-auto font-mono text-sm font-bold'>
        {Array.from(new Set(config?.recentFiles).values()).map(
          (recentPath, idx) => (
            <h1
              key={idx}
              className='px-2 py-0.5 first:pt-1 hover:bg-sky-200'
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
