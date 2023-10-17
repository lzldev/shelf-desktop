import {useEffect, useState} from 'react'

const useTheme = () => {
  const [theme, _setTheme] = useState<unknown>([])

  //TODO: Implement
  const setTheme = (theme: unknown) => {
    _setTheme(theme)
  }

  useEffect(() => {
    ;(async () => {
      // invoke loadConfig. || useConfig.config.theme
    })()
  }, [])

  return {theme, setTheme}
}

export {useTheme}
