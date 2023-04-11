import {useState} from 'react'
import {InlineButton} from './components/InlineButton'
import Versions from './components/Versions'
import {useConfig} from './hooks/useConfig'

function Options(): JSX.Element {
  const {config, saveConfig} = useConfig()
  const [pageSize, setPageSize] = useState(config.pageSize.toString())

  return (
    <div className='flex  min-h-screen max-w-full flex-col'>
      <div className='text-6xl'>OPTIONS</div>
      <div className='flex flex-col overflow-y-auto'>
        <p className='break-all font-mono text-2xl'>{JSON.stringify(config)}</p>
      </div>
      <div className='mb-auto flex flex-col px-20'>
        <label htmlFor=''>PageSize:</label>
        <input
          type='text'
          value={pageSize}
          onChange={(evt) => {
            setPageSize(evt.target.value)
          }}
          name='pageSize'
          id=''
        />
        <div className='flex flex-row-reverse'>
          <InlineButton
            onClick={() => {
              saveConfig({...config, pageSize: parseInt(pageSize)})
            }}
          >
            Save
          </InlineButton>
        </div>
      </div>
      <Versions />
    </div>
  )
}

export {Options}
