/**
 * Storybook preview — instala os mesmos plugins que a app usa, para que os
 * componentes renderizem (Vuetify, i18n, Pinia, filtros, permissões) e um
 * router em memória para componentes que usam <router-link>/useRoute.
 *
 * Scaffold não verificado no CI — ver nota em .storybook/main.js.
 */
import { setup } from '@storybook/vue3-vite'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'

import vuetify from '../src/plugins/vuetify'
import gettext from '../src/plugins/gettext'
import filters from '../src/plugins/filters'
import permissions from '../src/plugins/permissions'

setup((app) => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div />' } }],
  })
  app.use(createPinia())
  app.use(gettext)
  app.use(vuetify)
  app.use(filters)
  app.use(permissions)
  app.use(router)
})

/** @type { import('@storybook/vue3-vite').Preview } */
const preview = {
  decorators: [
    (story) => ({
      components: { story },
      template: '<v-app><v-main class="pa-4"><story /></v-main></v-app>',
    }),
  ],
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
  },
}

export default preview
