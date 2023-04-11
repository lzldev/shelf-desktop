import {useProgress} from './hooks/useProgress'

const Progress = (): JSX.Element => {
  const {progress} = useProgress()
  const startProgress = progress.get('start')

  return (
    <div className={'flex max-h-screen min-h-screen min-w-full flex-col'}>
      <div>
        <h1 className='pt-10 text-center align-text-bottom font-mono text-3xl font-bold'>
          {`Loading`}
        </h1>
      </div>
      <div className='flex grow items-center px-10'>
        <div className='h-10 w-full bg-black bg-opacity-20 ring'>
          <div
            className={`h-full animate-gradient_x bg-gradient-to-r from-red-500 to-fuchsia-500 transition-all`}
            style={{width: (startProgress?.value || 0) * 100 + '%'}}
          />
        </div>
      </div>
      <div className='overflow-hidden text-ellipsis  whitespace-nowrap  bg-black text-slate-300'>
        {(startProgress?.lastPaths || []).map((path, idx) => {
          return <span key={idx}>{path}</span>
        })}
      </div>
    </div>
  )
}

export {Progress}
