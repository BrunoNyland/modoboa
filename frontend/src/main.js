/**
 * main.js
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Plugins
import { registerPlugins } from '@/plugins'

// Components
import App from './App.vue'

// Composables
import { createApp } from 'vue'

//api
import repository from '@/api/repository.js'

let globalConfig

// Dev-only: intercept the API with mock data so the UI can run with no backend.
// Gated by VITE_MOCK_API — the dynamic import is dead-code-eliminated in
// production builds (where the flag is unset), so msw never ships.
async function startMockApi() {
  if (!import.meta.env.VITE_MOCK_API) {
    return
  }
  const { worker } = await import('@/mocks/browser')
  await worker.start({ onUnhandledRequest: 'bypass' })
}

startMockApi().then(() => {
  fetch(import.meta.env.BASE_URL + 'config.json').then((resp) => {
    resp.json().then((config) => {
      if (!config.API_BASE_URL) {
        throw Error('API_BASE_URL is not defined in config.json')
      }
      globalConfig = config
      repository.defaults.baseURL = config.API_BASE_URL

      const app = createApp(App)

      registerPlugins(app)

      app.mount('#app')

      app.provide('$config', config)
    })
  })
})

export const useGlobalConfig = () => globalConfig
