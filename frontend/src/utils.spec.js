import { describe, it, expect } from 'vitest'
import {
  getAbsoluteUrl,
  localeToBCP47,
  toGettextLocale,
  languageHasCoverage,
} from '@/utils'

describe('localeToBCP47', () => {
  it('converts the underscore form to a BCP 47 tag', () => {
    // Regression: `Intl.NumberFormat('pt_BR')` throws a RangeError, which
    // crashed rendering of $filesize/$date in Brazilian Portuguese.
    expect(localeToBCP47('pt_BR')).toBe('pt-BR')
  })

  it('leaves simple locales untouched', () => {
    expect(localeToBCP47('en')).toBe('en')
    expect(localeToBCP47('fr')).toBe('fr')
  })

  it('produces a tag Intl accepts', () => {
    expect(() => new Intl.NumberFormat(localeToBCP47('pt_BR'))).not.toThrow()
  })

  it('passes empty values through unchanged', () => {
    expect(localeToBCP47('')).toBe('')
    expect(localeToBCP47(undefined)).toBe(undefined)
  })
})

describe('toGettextLocale', () => {
  it('uppercases the region for hyphenated codes', () => {
    expect(toGettextLocale('pt-br')).toBe('pt_BR')
  })

  it('maps aliased codes to the existing locale', () => {
    // Regression: `zh-hant` used to become `zh_HANT`, which is not a known
    // frontend locale, so Chinese users hit "Language does no exist".
    expect(toGettextLocale('zh-hant')).toBe('zh')
  })

  it('leaves single-part codes untouched', () => {
    expect(toGettextLocale('fr')).toBe('fr')
    expect(toGettextLocale('en')).toBe('en')
  })

  it('passes empty values through unchanged', () => {
    expect(toGettextLocale('')).toBe('')
    expect(toGettextLocale(null)).toBe(null)
  })
})

describe('languageHasCoverage', () => {
  const translations = {
    pt_BR: { Account: 'Conta' },
    zh: {},
    en: {},
  }

  it('is true for the source language regardless of translations', () => {
    expect(languageHasCoverage(translations, 'en', 'en')).toBe(true)
  })

  it('is true when the mapped locale has messages', () => {
    expect(languageHasCoverage(translations, 'pt-br', 'en')).toBe(true)
  })

  it('is false for an empty (0% coverage) locale', () => {
    // zh-hant maps to zh, which has no messages.
    expect(languageHasCoverage(translations, 'zh-hant', 'en')).toBe(false)
  })

  it('is false for a locale absent from translations', () => {
    expect(languageHasCoverage(translations, 'ro', 'en')).toBe(false)
  })
})

describe('getAbsoluteUrl', () => {
  it('returns absolute URLs unchanged', () => {
    expect(getAbsoluteUrl('https://example.com/x')).toBe(
      'https://example.com/x'
    )
  })
})
