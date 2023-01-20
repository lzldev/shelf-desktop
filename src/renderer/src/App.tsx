import Versions from './components/Versions'
import icons from './assets/icons.svg'
import { OpenDialogOptions } from 'electron'
import { useState } from 'react'
import { TaggerFile, TaggerDir, TaggerImage } from '../../main/src/types'

function App(): JSX.Element {
  const [files, setFiles] = useState<TaggerFile[]>([])

  return (
    <div className="container">
      <Versions />
      <svg className="hero-logo" viewBox="0 0 900 300">
        <use xlinkHref={`${icons}#electron`} />
      </svg>
      <h2 className="hero-text">Tagger</h2>
      <div
        className="feature-item"
        onClick={(): void => {
          // window.api.dialog.showOpenDialog({ properties: ['openFile'] })
          const options: OpenDialogOptions = {
            properties: ['openDirectory']
          }

          window.api.openFile(options).then((val) => {
            console.log('val >', val)
            setFiles([])
            setFiles(val)
          })
          //window.electron.ipcRenderer.send('dialog', options)
          //window.dialog.showOpenDialog({ properties: ['openFile'] })
          // window.electron.ipcRenderer.send('dialog')
          // const dialogConfig = {
          //   title: 'Select a file',
          //   buttonLabel: 'This one will do',
          //   properties: ['openFile']
          // }
          // window.electron.ipcRenderer.invoke('dialog', dialogConfig)
          //window.dialog
        }}
      >
        <article>
          <h2 className="title">Test Button</h2>
          <p className="detail">{files[0]?.fullPath || 'Nothing Selected'}</p>
        </article>
      </div>
      <div className="features ">
        {
          Folder(files)
          // files.map((file, idx) => {
          //   const a = file as TaggerImage
          //   if (!a.isImage) {
          //     return (
          //       <div className="feature-item" key={idx}>
          //         <h2 className="title">FOLDER</h2>
          //         <h1>{file.name}</h1>
          //         <article></article>
          //       </div>
          //     )
          //   }
          //   return (
          //     <div className="feature-item" key={idx}>
          //       <article>
          //         <h2 className="title">Image</h2>
          //         fi
          //         <br />
          //         <hr />
          //         {file.name}
          //         <br />
          //         <h3 className="detail">{file.fullPath}</h3>
          //         <img
          //           src={`tagger://${file.fullPath}` || ''}
          //           style={{
          //             objectFit: 'contain',
          //             width: '100%'
          //           }}
          //         />
          //       </article>
          //     </div>
          //   )
          // })
        }
      </div>
    </div>
  )
}

const TImage = (file: TaggerImage, color = ''): JSX.Element => {
  return (
    <div className="feature-item">
      <article
        style={{
          backgroundColor: color || ''
        }}
      >
        <h2 className="title">Image</h2>
        fi
        <br />
        <hr />
        {file.name}
        <br />
        <a href={'tagger://' + file.fullPath}>
          <h3 className="detail">{file.fullPath}</h3>
        </a>
        <img
          src={`tagger://${file.fullPath}` || ''}
          style={{
            objectFit: 'contain',
            width: '100%'
          }}
        />
      </article>
    </div>
  )
}

const Folder = (files: TaggerFile[], passColor = 0): JSX.Element => {
  //const colors = ['#f0f0f0', '#a0a0a0', '#707070', '#303030', '#000000']

  // GTA 3 PALLETTE const colors = ['#3E432Eff', '#A1AB9Dff', '#715B40ff', '#28241Fff', '#141917ff']
  const colors = ['#141917ff', '#28241Fff', '#3E432Eff', '#A1AB9Dff', '#715B40ff']
  return (
    <>
      {files.map((file) => {
        const a = file as TaggerImage

        if (!a.isImage) {
          const b = file as TaggerDir
          if (!b.isDir) {
            return
          }
          return Folder(b.children, passColor + 1)
        }
        return TImage(file, colors[passColor])
      })}
    </>
  )
}

export default App
