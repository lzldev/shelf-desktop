import {InlineButton} from './components/InlineButton'
import {SidePanelModal} from './components/SidebarPanelModal'
import Versions from './components/Versions'
import {useConfigStore} from './hooks/useConfig'

function OptionsModal({
  onClose,
}: {
  onClose: (...any: any[]) => any
}): JSX.Element {
  const {config, setConfig, saveConfig} = useConfigStore()

  return (
    <SidePanelModal onClose={onClose}>
      <div className='flex  h-full w-full flex-col'>
        <div className='text-6xl'>OPTIONS</div>
        <div className='flex flex-col overflow-y-auto'>
          <p className='break-all font-mono text-2xl'>
            {JSON.stringify(config)}
          </p>
        </div>
        <div className='mb-auto flex flex-col px-20'>
          <label htmlFor=''>PageSize:</label>
          <input
            type='text'
            value={config!.pageSize}
            onChange={(evt) => {
              setConfig({
                pageSize: parseInt(evt.target.value || '0'),
              })
            }}
          />
          <label>Default Color:</label>
          <input
            type='color'
            value={config!.defaultColor}
            onChange={(evt) => {
              setConfig({
                defaultColor: evt.target.value,
              })
            }}
          />
          <div className='flex flex-row-reverse'>
            <InlineButton onClick={saveConfig}>Save</InlineButton>
          </div>
        </div>
        <Versions />
      </div>
    </SidePanelModal>
  )
}

export {OptionsModal}
