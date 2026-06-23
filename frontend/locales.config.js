// Which translation locales are bundled into the production build.
//
// The compiled translations file (src/locale/translations.json) always
// contains every language, but shipping all of them embeds them in the
// main JS bundle. Trimming this list produces a smaller bundle — handy
// when an instance only needs a couple of languages.
//
// Edit BUNDLED_LOCALES below, or override at build time without touching
// the file:
//
//   MODOBOA_LOCALES=en,pt_BR yarn build
//
// English ('en', the source language) is always included.

export const ALL_LOCALES = [
  'en',
  'br',
  'cs',
  'de',
  'el',
  'es',
  'fi',
  'fr',
  'it',
  'ja',
  'nl',
  'pl',
  'pt_BR',
  'ru',
  'sv',
  'tr',
  'zh',
]

// 👉 Edit this to ship fewer languages, e.g. ['en', 'pt_BR'].
//    Keep it as ALL_LOCALES to bundle every available translation.
const BUNDLED_LOCALES = ALL_LOCALES

export function getEnabledLocales() {
  const fromEnv = (process.env.MODOBOA_LOCALES || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
  const requested = new Set([
    'en',
    ...(fromEnv.length ? fromEnv : BUNDLED_LOCALES),
  ])
  // Keep the canonical order and silently drop unknown locales.
  return ALL_LOCALES.filter((locale) => requested.has(locale))
}
