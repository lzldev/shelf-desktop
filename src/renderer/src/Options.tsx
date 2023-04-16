import {InlineButton} from './components/InlineButton'
import Versions from './components/Versions'
import {useConfig} from './hooks/useConfig'

function Options(): JSX.Element {
  const {config, setConfig, saveConfig} = useConfig()

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
          value={config.pageSize}
          onChange={(evt) => {
            setConfig((draft) => {
              draft.pageSize = parseInt(evt.target.value || '0')
            })
          }}
        />
        <label>Default Color:</label>
        <input
          type='color'
          value={config.defaultColor}
          onChange={(evt) => {
            setConfig((draft) => {
              draft.defaultColor = evt.target.value
            })
          }}
        />
        <div className='flex flex-row-reverse'>
          <InlineButton onClick={saveConfig}>Save</InlineButton>
        </div>
      </div>
      <Versions />
    </div>
  )
}

export {Options}
