import { OpenDialogOptions } from 'electron'

const dialogHandlers = ['tagger:dialog:ChooseLocalDir', 'tagger:showMessage'] as const
type startUpEvents = typeof dialogHandlers[number]

enum taggerDialogHandlers {
  chooseLocalDir = 'tagger:ChooseLocalDir',
  message = 'tagger:showMessage'
}

type invokeDialog<Type> = (args: OpenDialogOptions) => Promise<Type>

export { taggerDialogHandlers as ipcHandlers, invokeDialog }
