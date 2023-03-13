import {useQuery} from '@tanstack/react-query'
import Versions from './components/Versions'

function StartPage(): JSX.Element {
  const fetchRecentPaths = async () => {
    return await window.api.invokeOnMain('getRecent', null)
  }

  const {data: paths,error,isLoading} = useQuery({
    queryKey: ['recentPath'],
    queryFn: fetchRecentPaths,
  })

  const openDialog = async (dir: 'openFile' | 'openDirectory') => {
    const dialog = await window.api.invokeOnMain('openDialog', {
      dialogType: dir,
    })
    if (dialog.canceled) return

    await window.api.invokeOnMain('startTaggerClient', dialog.filePaths)
  }

  return (
    <div className='container'>
      <div className='horizontalContainer'>
        <div
          className='flex-1 justify-center text-center transition-all hover:bg-slate-200'
          onClick={() => openDialog('openDirectory')}
        >
          <h1 className='text-3xl font-bold'>Open Directory</h1>
        </div>
        <div
          className='flex-1 justify-center text-center transition-all hover:bg-slate-200'
          onClick={() => openDialog('openFile')}
        >
          <h1 className='text-3xl font-bold'>Open TaggerDB</h1>
        </div>
      </div>
      <hr style={{marginTop: '10px', marginBottom: '10px'}} />
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
      <Versions />
    </div>
  )
}

export default StartPage
