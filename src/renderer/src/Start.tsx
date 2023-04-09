import {useQuery} from '@tanstack/react-query'
import Versions from './components/Versions'

function Start(): JSX.Element {
  const {data: paths} = useQuery(['recentPath'], async () => {
    return await (
      await window.api.invokeOnMain('getConfig')
    ).recentFiles
  })

  const openDialog = async (dir: 'openFile' | 'openDirectory') => {
    const dialog = await window.api.invokeOnMain('openDialog', {
      dialogType: dir,
    })
    if (dialog.canceled || dialog.filePaths.length === 0) return

    await window.api.invokeOnMain('startTaggerClient', dialog.filePaths[0])
  }

  return (
    <div className='flex min-h-screen min-w-full flex-col'>
      <div className='flex flex-row'>
        <div
          className='flex-1 justify-center py-5 text-center transition-all hover:bg-slate-200'
          onClick={() => openDialog('openDirectory')}
        >
          <h1 className='text-3xl font-bold'>Open Directory</h1>
        </div>
        <div
          className='flex-1 justify-center py-5 text-center transition-all hover:bg-slate-200'
          onClick={() => openDialog('openFile')}
        >
          <h1 className='text-3xl font-bold'>Open TaggerDB</h1>
        </div>
      </div>
      <div className='h-1 bg-black bg-opacity-10 py-2' />
      <div className='flex h-1 grow flex-col overflow-y-auto'>
        {(paths || []).map((recentPath, idx) => (
          <h1
            key={idx}
            className='recentPath text-3xl font-bold hover:bg-sky-200'
            onClick={() => {
              window.api.invokeOnMain('startTaggerClient', recentPath)
            }}
          >
            {recentPath}
          </h1>
        ))}
      </div>
      <Versions />
    </div>
  )
}

export default Start
