import { describe, expect, it } from 'vitest'
import {
  findBinding,
  isEditableTarget,
  shouldHandleKey,
} from './useKeyboardShortcuts'

// Minimal Element stand-in: `closest` returns a truthy match when the fake
// element (or an ancestor) matches one of the given selectors.
const fakeEl = (matches = []) => ({
  closest: (selector) =>
    selector
      .split(',')
      .map((s) => s.trim())
      .some((s) => matches.includes(s))
      ? {}
      : null,
})

const keyEvent = (overrides = {}) => ({
  key: 'j',
  defaultPrevented: false,
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  shiftKey: false,
  target: fakeEl(),
  ...overrides,
})

describe('isEditableTarget', () => {
  it('is false for plain elements and non-elements', () => {
    expect(isEditableTarget(fakeEl())).toBe(false)
    expect(isEditableTarget(null)).toBe(false)
    expect(isEditableTarget({})).toBe(false)
  })

  it('is true inside inputs, textareas and the tiptap editor', () => {
    expect(isEditableTarget(fakeEl(['input']))).toBe(true)
    expect(isEditableTarget(fakeEl(['textarea']))).toBe(true)
    expect(isEditableTarget(fakeEl(['.tiptap']))).toBe(true)
    expect(isEditableTarget(fakeEl(['[contenteditable="true"]']))).toBe(true)
  })
})

describe('shouldHandleKey', () => {
  it('accepts a plain keypress', () => {
    expect(shouldHandleKey(keyEvent())).toBe(true)
  })

  it('allows Shift (needed for ?)', () => {
    expect(shouldHandleKey(keyEvent({ key: '?', shiftKey: true }))).toBe(true)
  })

  it('rejects modifier combos', () => {
    expect(shouldHandleKey(keyEvent({ ctrlKey: true }))).toBe(false)
    expect(shouldHandleKey(keyEvent({ metaKey: true }))).toBe(false)
    expect(shouldHandleKey(keyEvent({ altKey: true }))).toBe(false)
  })

  it('rejects already-handled events', () => {
    expect(shouldHandleKey(keyEvent({ defaultPrevented: true }))).toBe(false)
  })

  it('rejects keypresses while typing', () => {
    expect(shouldHandleKey(keyEvent({ target: fakeEl(['input']) }))).toBe(false)
    expect(shouldHandleKey(keyEvent({ target: fakeEl(['.tiptap']) }))).toBe(
      false
    )
  })

  it('rejects keypresses while an overlay is open', () => {
    expect(shouldHandleKey(keyEvent(), { overlayOpen: true })).toBe(false)
  })
})

describe('findBinding', () => {
  const bindings = [
    { keys: ['j'], handler: () => 'down' },
    { keys: ['Enter', 'o'], handler: () => 'open' },
    { keys: ['#', 'Delete'], handler: () => 'delete' },
  ]

  it('matches single and aliased keys', () => {
    expect(findBinding(bindings, 'j').handler()).toBe('down')
    expect(findBinding(bindings, 'o').handler()).toBe('open')
    expect(findBinding(bindings, 'Enter').handler()).toBe('open')
    expect(findBinding(bindings, 'Delete').handler()).toBe('delete')
  })

  it('returns null for unbound keys', () => {
    expect(findBinding(bindings, 'z')).toBe(null)
  })
})
