import { describe, expect, it } from 'vitest'
import type { RecentWorktreeItem } from '@/types/projects'
import {
  getAdjacentRecentRow,
  getRecentShortcutIndex,
  isRecentShortcutModifierHeld,
} from './RecentWorktreesList'

function row(sessionId: string): RecentWorktreeItem {
  return {
    session: { id: sessionId },
  } as RecentWorktreeItem
}

describe('getAdjacentRecentRow', () => {
  const rows = [row('first'), row('second'), row('third')]

  it('moves down and up from the selected session', () => {
    expect(getAdjacentRecentRow(rows, 'second', 1)?.session.id).toBe('third')
    expect(getAdjacentRecentRow(rows, 'second', -1)?.session.id).toBe('first')
  })

  it('stays at the first and last row at the boundaries', () => {
    expect(getAdjacentRecentRow(rows, 'first', -1)?.session.id).toBe('first')
    expect(getAdjacentRecentRow(rows, 'third', 1)?.session.id).toBe('third')
  })

  it('starts at the edge that matches the direction', () => {
    expect(getAdjacentRecentRow(rows, null, 1)?.session.id).toBe('first')
    expect(getAdjacentRecentRow(rows, null, -1)?.session.id).toBe('third')
  })

  it('returns no row for an empty list', () => {
    expect(getAdjacentRecentRow([], null, 1)).toBeUndefined()
  })
})

describe('recent session number shortcuts', () => {
  // Set both keys so the test does not depend on the platform mod key.
  const modShift = {
    metaKey: true,
    ctrlKey: true,
    shiftKey: true,
    altKey: false,
  }

  it('maps Mod+Shift+1-9 to row indexes', () => {
    expect(getRecentShortcutIndex({ ...modShift, code: 'Digit1' })).toBe(0)
    expect(getRecentShortcutIndex({ ...modShift, code: 'Digit9' })).toBe(8)
  })

  it('ignores 0, other keys, and wrong modifiers', () => {
    expect(getRecentShortcutIndex({ ...modShift, code: 'Digit0' })).toBeNull()
    expect(getRecentShortcutIndex({ ...modShift, code: 'KeyA' })).toBeNull()
    expect(
      getRecentShortcutIndex({ ...modShift, shiftKey: false, code: 'Digit1' })
    ).toBeNull()
    expect(
      getRecentShortcutIndex({ ...modShift, altKey: true, code: 'Digit1' })
    ).toBeNull()
    expect(
      getRecentShortcutIndex({
        ...modShift,
        metaKey: false,
        ctrlKey: false,
        code: 'Digit1',
      })
    ).toBeNull()
  })

  it('shows hints only while Mod+Shift is held', () => {
    expect(isRecentShortcutModifierHeld(modShift)).toBe(true)
    expect(isRecentShortcutModifierHeld({ ...modShift, shiftKey: false })).toBe(
      false
    )
    expect(
      isRecentShortcutModifierHeld({
        ...modShift,
        metaKey: false,
        ctrlKey: false,
      })
    ).toBe(false)
  })
})
