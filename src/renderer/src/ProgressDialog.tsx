import {useProgress} from './hooks/useProgress'

const ProgressDialog = (): JSX.Element => {
  const {progress} = useProgress()
  const startProgress = progress.get('start')

  return (
    <div
      className={
        'flex h-screen w-screen flex-col items-center overflow-hidden p-10 first-line:first-letter:marker:selection:file:justify-center'
      }
    >
      <div className='flex-1 justify-center text-center transition-all'>
        <h1 className='  text-3xl font-bold'>Loading </h1>
      </div>
      <div className='my-10 h-10 min-w-full'>
        <div
          className={`min-h-full
            animate-gradient_x bg-gradient-to-r from-red-500
            to-fuchsia-500 ring active:animate-rubberBand`}
          style={{width: (startProgress?.value || 0) * 100 + '%'}}
        />
      </div>
      <div className='bg-black text-slate-300'>
        {(startProgress?.lastPaths || []).map((path, idx) => {
          return (
            <span
              className='block'
              key={idx}
            >
              {path}
            </span>
          )
        })}
      </div>
    </div>
  )
}

export default ProgressDialog
