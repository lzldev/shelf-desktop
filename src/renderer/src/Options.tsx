import Versions from './components/Versions'
import {useConfig} from './hooks/useConfig'

function Options(): JSX.Element {
  const {config} = useConfig()
  return (
    <div className='min-h-screen min-w-full'>
      <div className='text-6xl'>OPTIONS</div>
      <p className='prose text-2xl'>{JSON.stringify(config)}</p>
      <Versions />
    </div>
  )
}

export default Options
