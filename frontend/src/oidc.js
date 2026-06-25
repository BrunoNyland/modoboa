import { UserManager } from 'oidc-client-ts'

import { getAbsoluteUrl } from '@/utils'

/**
 * Build the OIDC client (oidc-client-ts UserManager) from the runtime config.
 *
 * Shared between the auth store and the early pre-mount auth check in main.js,
 * so both create identical clients — the sign-in state stored by one (during
 * the early redirect) is readable by the other on the callback.
 */
export function createUserManager(config) {
  return new UserManager({
    authority: config.OAUTH_AUTHORITY_URL,
    client_id: config.OAUTH_CLIENT_ID,
    redirect_uri: getAbsoluteUrl(config.OAUTH_REDIRECT_URI),
    post_logout_redirect_uri: getAbsoluteUrl(config.OAUTH_POST_REDIRECT_URI),
    response_type: 'code',
    scope: 'openid read write',
    automaticSilentRenew: true,
    accessTokenExpiringNotificationTime: 60,
    monitorSession: true,
    filterProtocolClaims: true,
    loadUserInfo: true,
  })
}
