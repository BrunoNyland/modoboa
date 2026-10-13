import { describe, expect, it, vi } from 'vitest'
import {
  displayRecipient,
  formatRecipient,
  getRecipientAddress,
  isValidRecipient,
  splitRecipients,
  uniqueRecipients,
} from './webmail'

// The helpers under test don't use the stores (which pull in the router)
vi.mock('@/stores', () => ({}))

describe('recipients', () => {
  it('formats a recipient with its name quoted', () => {
    expect(formatRecipient({ name: 'Doe, "J"', address: 'j@x.com' })).toBe(
      '"Doe, \\"J\\"" <j@x.com>'
    )
    expect(formatRecipient({ name: '', address: 'j@x.com' })).toBe('j@x.com')
  })

  it('displays a recipient without the quotes of its name', () => {
    expect(displayRecipient('"Doe, John" <j@x.com>')).toBe(
      'Doe, John <j@x.com>'
    )
  })

  it('splits a pasted list, keeping quoted names and brackets', () => {
    expect(
      splitRecipients('a@x.com; "Doe, John" <j@x.com>,\nb@x.com , <c,d@x.com>')
    ).toEqual(['a@x.com', '"Doe, John" <j@x.com>', 'b@x.com', '<c,d@x.com>'])
  })

  it('validates the address part only', () => {
    expect(isValidRecipient('"Doe" <j@x.com>')).toBe(true)
    expect(isValidRecipient('j@x.com')).toBe(true)
    expect(isValidRecipient('jx.com')).toBe(false)
    expect(isValidRecipient('j @x.com')).toBe(false)
    expect(getRecipientAddress('Doe <j@x.com>')).toBe('j@x.com')
  })

  it('keeps the first recipient of each address', () => {
    expect(
      uniqueRecipients(['"A" <a@x.com>', 'A@X.com', 'b@x.com', 'b@x.com'])
    ).toEqual(['"A" <a@x.com>', 'b@x.com'])
  })
})
