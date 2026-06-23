import { createGettext } from 'vue3-gettext'
// Only the locales selected in locales.config.js (or via MODOBOA_LOCALES)
// are bundled here — see the virtual module in vite.config.js.
import { translations, enabledLocales } from 'virtual:modoboa-translations'

const ALL_AVAILABLE_LANGUAGES = {
  br: 'Breton',
  cs: 'Czech',
  de: 'German',
  el: 'Greek',
  en: 'English',
  es: 'Spain',
  fi: 'Finnish',
  fr: 'French',
  it: 'Italian',
  ja: 'Japanese',
  nl: 'Dutch',
  pl: 'Polish',
  pt_BR: 'Portuguese (BR)',
  ru: 'Russian',
  sv: 'Swedish',
  tr: 'tr',
  zh: 'Chinese',
}

// Restrict the languages vue3-gettext knows about to the bundled ones.
const availableLanguages = Object.fromEntries(
  Object.entries(ALL_AVAILABLE_LANGUAGES).filter(([code]) =>
    enabledLocales.includes(code)
  )
)

export const DEFAULT_LANGUAGE = 'en'

export default createGettext({
  availableLanguages,
  defaultLanguage: DEFAULT_LANGUAGE,
  translations: translations,
  silent: true, // stop warnings
})
