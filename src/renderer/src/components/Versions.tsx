const versions = window.electron.process.versions

function Versions(): JSX.Element {
  return (
    <ul className='flex flex-row'>
      <li className='unselectable flex-auto text-xs lowercase opacity-50'>
        Electron v{versions.electron}
      </li>
      <li className='unselectable flex-auto text-xs lowercase opacity-50'>
        Chromium v{versions.chrome}
      </li>
      <li className='unselectable flex-auto text-xs lowercase opacity-50'>
        Node v{versions.node}
      </li>
      <li className='unselectable flex-auto text-xs lowercase opacity-50'>
        V8 v{versions.v8}
      </li>
    </ul>
  )
}

export default Versions
