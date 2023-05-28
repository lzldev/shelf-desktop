import {InlineButton} from './components/InlineButton'
import {SidePanelModal} from './components/SidebarPanelModal'
import Versions from './components/Versions'
import {useConfigStore} from './hooks/useConfig'
import {useHotkeys} from './hooks/useHotkeys'

function OptionsModal({
  onClose,
}: {
  onClose: (...any: any[]) => any
}): JSX.Element {
  const {config, setConfig, saveConfig} = useConfigStore()

  useHotkeys({
    Escape: onClose,
  })

  return (
    <SidePanelModal
      onClose={onClose}
      className='w-fit min-w-[20rem] max-w-[80vw] p-0'
    >
      <div className='flex  h-full w-full flex-col p-4'>
        <div className='flex flex-row-reverse'>
          <span
            className='font-mono text-3xl duration-50 hover:text-white'
            onClick={onClose}
          >
            X
          </span>
        </div>
        {/* <div className='text-6xl'>OPTIONS</div> */}
        {/* <div className='flex flex-col overflow-y-auto'>
          <p className='w-1/2 flex-wrap  break-words font-mono'>
            {JSON.stringify(config)}
          </p>
        </div> */}
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
      </div>
      <Versions />
    </SidePanelModal>
  )
}

export {OptionsModal}
