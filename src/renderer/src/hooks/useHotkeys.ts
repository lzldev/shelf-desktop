import {useEffect} from 'react'
import {useToggle} from './useToggle'

type useHotkeysStart = {
  [key: string]: (...any: any[]) => any
}

function useHotkeys(hotkeys: useHotkeysStart, isEnabled = true) {
  const {value: enabled, toggle, turnOff, turnOn} = useToggle(isEnabled)

  useEffect(() => {
    if (!enabled) return
    const hotkeysListener = (evt: KeyboardEvent) => {
      const isRegistered = !!hotkeys[evt.key]

      if (isRegistered) {
        hotkeys[evt.key]()
      }
    }
    addEventListener('keydown', hotkeysListener)
    return () => {
      removeEventListener('keydown', hotkeysListener)
    }
  }, [enabled])

  return {enabled, toggle, turnOff, turnOn}
}

export {useHotkeys}
