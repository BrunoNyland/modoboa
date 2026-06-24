/**
 * plugins/vuetify.js
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Styles
// Self-hosted Roboto (no external Google Fonts request). Only the weights
// the app uses (300/400/500/700), latin + latin-ext subsets — enough for
// en/pt_BR and other Western-European text.
import '@fontsource/roboto/latin-300.css'
import '@fontsource/roboto/latin-400.css'
import '@fontsource/roboto/latin-500.css'
import '@fontsource/roboto/latin-700.css'
import '@fontsource/roboto/latin-ext-300.css'
import '@fontsource/roboto/latin-ext-400.css'
import '@fontsource/roboto/latin-ext-500.css'
import '@fontsource/roboto/latin-ext-700.css'
import 'vuetify/styles'
import '@/styles/main.scss'
import {
  cs,
  de,
  el,
  en,
  es,
  fi,
  fr,
  it,
  ja,
  nl,
  pl,
  pt,
  ru,
  sv,
  tr,
  zhHans,
} from 'vuetify/locale'

// Composables
import { h } from 'vue'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg'
import { mdiIcons } from './icons'

// SVG icon set: resolves the `mdi-*` names used across the app to the SVG
// paths in icons.js (a tree-shaken subset of @mdi/js). Values that aren't
// in the map — e.g. Vuetify's internal `$` aliases, already resolved to
// SVG paths — are passed through unchanged.
const mdiSvg = {
  component: (props) =>
    h(mdi.component, { ...props, icon: mdiIcons[props.icon] ?? props.icon }),
}

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
  components,
  directives,
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: { mdi: mdiSvg },
  },
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          primary: '#046BF8',
          'primary-lighten-1': '#3688F9',
          'primary-darken-1': '#0350BA',
          secondary: '#F18429',
          label: '#616161',
        },
      },
    },
  },
  locale: {
    locale: 'en',
    fallback: 'en',
    messages: {
      cs,
      de,
      el,
      en,
      es,
      fi,
      fr,
      it,
      ja,
      nl,
      pl,
      pt,
      ru,
      sv,
      tr,
      zhHans,
    },
  },
  styles: { configFile: 'src/styles/settings.scss' },
  defaults: {
    VBtn: {
      class: 'text-uppercase',
      style: 'letter-spacing: 0.05em',
    },
    VCard: {
      class: 'pa-2',
      VCardTitle: { class: 'd-flex', style: 'align-items: center;' },
    },
  },
})
