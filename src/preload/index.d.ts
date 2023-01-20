import { ElectronAPI } from '@electron-toolkit/preload'
import { OpenDialogOptions } from 'electron'
import { invokeDialog } from '../main/src/ipcEvents'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      //TODO: type the promise returns.
      openFile: invokeDialog<any>
      showMessage(args: OpenDialogOptions): Promise<any>
    }
  }
}
