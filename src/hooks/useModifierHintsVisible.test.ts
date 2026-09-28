import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useModifierHintsVisible } from './useModifierHintsVisible'

const isCtrlHeld = (event: Pick<KeyboardEvent, 'ctrlKey'>) => event.ctrlKey

function press(type: 'keydown' | 'keyup', init: KeyboardEventInit) {
  act(() => {
    window.dispatchEvent(new KeyboardEvent(type, init))
  })
}

describe('useModifierHintsVisible', () => {
  it('is visible only while the modifier is held', () => {
    const { result } = renderHook(() => useModifierHintsVisible(isCtrlHeld))
    expect(result.current).toBe(false)

    press('keydown', { key: 'Control', ctrlKey: true })
    expect(result.current).toBe(true)

    press('keyup', { key: 'Control', ctrlKey: false })
    expect(result.current).toBe(false)
  })

  it('hides when the window loses focus', () => {
    const { result } = renderHook(() => useModifierHintsVisible(isCtrlHeld))
    press('keydown', { key: 'Control', ctrlKey: true })
    act(() => {
      window.dispatchEvent(new Event('blur'))
    })
    expect(result.current).toBe(false)
  })

  it('stays hidden when disabled', () => {
    const { result } = renderHook(() =>
      useModifierHintsVisible(isCtrlHeld, false)
    )
    press('keydown', { key: 'Control', ctrlKey: true })
    expect(result.current).toBe(false)
  })
})
