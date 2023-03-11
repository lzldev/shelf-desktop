import Versions from './components/Versions'
import { useProgress } from './hooks/useProgress'

const ProgressDialog = (): JSX.Element => {
  const { progress } = useProgress()
  const startProgress = progress.get('start') || 0

  return (
    <div className={'window'}>
      <div className='p-10 align-middle'>
        <div className='flex-1 justify-center text-center transition-all'>
          <h1 className='  text-3xl font-bold'>Loading </h1>
        </div>
        {/* <div>
          <progress
            max={100}
            value={startProgress * 100}
            className='mx-auto h-7 min-w-full border-slate-200 border-opacity-40 bg-gradient-to-tr from-red-500 to-cyan-300  fill-red-500 outline'
          />
        </div> */}
        <div className='my-10 h-10 min-w-full outline'>
          <div
            className={`min-h-full animate-gradient_x bg-gradient-to-r from-red-500 to-fuchsia-500 active:animate-rubberBand `}
            style={{ width: startProgress * 100 + '%' }}
          />
        </div>
      </div>
      <Versions />
    </div>
  )
}

export default ProgressDialog
