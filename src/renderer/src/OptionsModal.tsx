import {InlineButton} from './components/InlineButton'
import {SidePanelModal} from './components/SidebarPanelModal'
import Versions from './components/Versions'
import {useConfigStore} from './hooks/useConfig'
import {useHotkeys} from './hooks/useHotkeys'
import {useLocalConfigStore} from './hooks/useLocalConfig'

function OptionsModal({
  onClose,
}: {
  onClose: (...any: any[]) => any
}): JSX.Element {
  const {config, modified, setConfig, saveConfig} = useConfigStore()

  const {
    config: clientConfig,
    setConfig: setClientConfig,
    saveConfig: saveClientConfig,
    modified: modifiedClient,
  } = useLocalConfigStore()

  useHotkeys({
    Escape: onClose,
  })

  return (
    <SidePanelModal
      onClose={onClose}
      className='w-fit min-w-[20rem] max-w-[80vw] p-0'
    >
      <div className='flex  h-full w-full flex-col p-4'>
        <div className='overflow-y-auto px-20'>
          <p className='-m-2 mb-2 text-xl'>Directory Options</p>
          <div className='flex flex-row'>
            <input
              type='checkbox'
              className='mr-1'
              checked={clientConfig!.ignoreUnsupported}
              onChange={(evt) => {
                setClientConfig({ignoreUnsupported: evt.currentTarget.checked})
              }}
            />
            <p>Ignore Unsupported</p>
          </div>
          <div className='flex flex-row'>
            <input
              className='mr-1'
              type='checkbox'
              checked={clientConfig!.ignoreHidden}
              onChange={(evt) => {
                setClientConfig({ignoreHidden: evt.currentTarget.checked})
              }}
            />
            <span>Ignore Hidden Folders</span>
          </div>

          <span>Ignored Paths:</span>
          <div className='min-h-[6rem] w-full overflow-y-scroll bg-white'>
            {clientConfig?.ignoredPaths.map((p, idx, arr) => (
              <div
                className='group/path flex hover:bg-gray-200'
                key={idx}
              >
                <span className='flex grow self-center text-start'>{p}</span>
                <span
                  className='pointer-events-auto flex px-2 py-0.5 font-mono font-bold hover:bg-red-500'
                  onClick={() => {
                    arr.splice(idx, 1)
                    setClientConfig({
                      ignoredPaths: arr,
                    })
                  }}
                >
                  X
                </span>
              </div>
            ))}
          </div>
          <div className='flex flex-row-reverse'>
            <InlineButton onClick={saveClientConfig}>Save</InlineButton>
            {modifiedClient && (
              <span className='ftext-sm grow self-center text-end'>
                Unsaved Changes*
              </span>
            )}
          </div>
          {/*---------- APP CONFIG -------------------------- */}
          <hr className='-mx-20 my-6'></hr>
          <p className='-m-2 mb-2 text-xl'>App Options</p>
          <div>
            <label htmlFor=''>PageSize:</label>
            <input
              type='text'
              value={config!.pageSize}
              className='p-1'
              onChange={(evt) => {
                setConfig({
                  pageSize: parseInt(evt.target.value || '0'),
                })
              }}
            />
          </div>
          <div>
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
          </div>
          <div>
            <label>Layout:</label>
            <select
              onChange={(evt) => {
                setConfig({
                  layoutMode: evt.currentTarget.value as any,
                })
              }}
              value={config?.layoutMode}
              className='bg-white py-1'
            >
              <option value={'grid'}>Grid</option>
              <option value={'masonry'}>Masonry</option>
            </select>
          </div>
          <div className='flex flex-row-reverse'>
            <InlineButton onClick={saveConfig}>Save</InlineButton>
            {modified && (
              <span className='grow self-center text-end text-sm'>
                Unsaved Changes*
              </span>
            )}
          </div>
        </div>
      </div>
      <Versions />
    </SidePanelModal>
  )
}

export {OptionsModal}
