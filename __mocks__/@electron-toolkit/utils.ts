const electronApp = {
  setAppUserModelId: (name: string) => {
    console.log(`APP NAME SET ${name}`)
  },
}

const is = {
  dev: true,
}

const optmizer = {
  watchWindowShortcuts: (window) => {
    console.log(`Watching for window shortcuts.`)
  },
}

export {electronApp, is, optmizer}
