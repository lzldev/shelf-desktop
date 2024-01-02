import {describe, expect, test} from 'vitest'

//@ts-ignore tsconfig scope
import {encodePathIntoURI} from '../src/renderer/src/utils/Path'

describe('Windows Paths', () => {
  test('Should create a valid URI for windows', () => {
    const windowsPath = encodePathIntoURI('C:\\Windows\\System32')

    expect(windowsPath).toMatch('file:///C%3A/Windows/System32')
  })
})
