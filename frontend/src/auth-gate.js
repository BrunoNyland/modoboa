/**
 * Lightweight login gate, loaded by the inline script in index.html ONLY when
 * the visitor is unauthenticated. It pulls in oidc-client-ts (via @/oidc) but
 * NOT the app shell / Vuetify / Module Federation runtime, so an unauthenticated
 * visitor is redirected to the IdP without downloading the heavy SPA.
 *
 * Uses the same createUserManager as the auth store, so the sign-in state it
 * stores is read back by the SPA on the OIDC callback.
 */
import { createUserManager } from '@/oidc'

export async function redirectToLogin() {
  const response = await fetch(import.meta.env.BASE_URL + 'config.json')
  const config = await response.json()
  if (!config.API_BASE_URL) {
    throw new Error('API_BASE_URL is not defined in config.json')
  }
  const manager = createUserManager(config)
  await manager.signinRedirect()
}
