const versions = window.electron.process.versions

function Versions(): JSX.Element {
  return (
    <ul className='flex flex-row gap-2 bg-black bg-opacity-5 px-2 text-xs lowercase text-black text-opacity-40'>
      <li className='flex-auto'>Electron v{versions.electron}</li>
      <li className='flex-auto'>Chromium v{versions.chrome}</li>
      <li className='flex-auto'>Node v{versions.node}</li>
      <li className='flex-auto'>V8 v{versions.v8}</li>
    </ul>
  )
}

export default Versions
