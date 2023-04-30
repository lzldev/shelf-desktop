import {useEffect, useRef} from 'react'
import {useToggle} from './useToggle'
import {Key} from 'src/types/Keys'

type useHotkeysProps = {
  [key in Key]?: (...any: any[]) => any
}

function useHotkeys(hotkeys: useHotkeysProps, isEnabled = true) {
  const {value: enabled, toggle, turnOff, turnOn} = useToggle(isEnabled)

  useEffect(() => {
    if (!enabled) return
    const hotkeysListener = (evt: KeyboardEvent) => {
      const isRegistered = !!hotkeys[evt.key as Key]

      if (isRegistered) {
        hotkeys[evt.key as Key]!()
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

type useHotkeysRef = {
  [key in Key]?: {
    down: (...any: any[]) => any
    up: (...any: any[]) => any
  }
}

function useHotkeysRef<TH extends useHotkeysRef>(
  hotkeys: TH,
  isEnabled = true,
  runOnce = true,
) {
  const keys = useRef<{[key in keyof typeof hotkeys]?: boolean}>({})

  useEffect(() => {
    if (!isEnabled) return
    const downListener = (evt: KeyboardEvent) => {
      const key = evt.key as Key

      if (hotkeys[key] && !(runOnce && keys.current[key] === true)) {
        keys.current[key] = true
        hotkeys[evt.key as Key]!.down()
      }
    }
    const upListener = (evt: KeyboardEvent) => {
      const key = evt.key as Key
      if (hotkeys[key]) {
        keys.current[key] = false
        hotkeys[evt.key as Key]!.up()
      }
    }
    addEventListener('keydown', downListener)
    addEventListener('keyup', upListener)
    return () => {
      removeEventListener('keypress', downListener)
      removeEventListener('keyup', upListener)
    }
  }, [isEnabled])

  return {keys}
}

export {useHotkeysRef}
