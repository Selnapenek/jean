import { describe, expect, it } from 'vitest'
import { findTableMessageIndex, isSameTableKey } from './pinned-table-reveal'

const MESSAGES = [{ id: 'u1' }, { id: 'a1' }, { id: 'u2' }, { id: 'a2' }]

describe('findTableMessageIndex', () => {
  it('finds the message of a plain table key', () => {
    expect(findTableMessageIndex(MESSAGES, 'a1:120')).toBe(1)
  })

  it('finds the last message of a compact group key', () => {
    expect(findTableMessageIndex(MESSAGES, 'compact-a1:0')).toBe(1)
    expect(findTableMessageIndex(MESSAGES, 'compact-u2-a2:40')).toBe(3)
  })

  it('returns -1 when the message is not loaded', () => {
    expect(findTableMessageIndex(MESSAGES, 'old:0')).toBe(-1)
    expect(findTableMessageIndex(MESSAGES, 'compact-old:0')).toBe(-1)
  })
})

describe('isSameTableKey', () => {
  it('matches the same table in full and compact views', () => {
    expect(isSameTableKey('a2:40', 'compact-u2-a2:40', 'a2')).toBe(true)
    expect(isSameTableKey('compact-a2:40', 'a2:40', 'a2')).toBe(true)
    expect(isSameTableKey('compact-u2-a2:40', 'a2:40', 'a2')).toBe(true)
  })

  it('does not match another table or message', () => {
    expect(isSameTableKey('a2:41', 'a2:40', 'a2')).toBe(false)
    expect(isSameTableKey('a1:40', 'a2:40', 'a2')).toBe(false)
    expect(isSameTableKey('a2:40', 'compact-a2:40', null)).toBe(false)
  })
})
