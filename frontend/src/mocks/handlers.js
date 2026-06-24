/**
 * Handlers do MSW para o modo de desenvolvimento sem backend.
 *
 * Os paths usam curinga (`*`) no início porque o baseURL real é `/api/v2/`.
 * Para mexer numa view específica, adicione um handler aqui devolvendo o
 * shape que aquela view espera. O handler catch-all do final evita que a app
 * quebre em endpoints ainda não mockados (e avisa no console).
 */
import { http, HttpResponse } from 'msw'

import * as fx from './fixtures'

const json = (data, init) => HttpResponse.json(data, init)

export const handlers = [
  // ----- bootstrap (necessário para a app subir "logada") -----
  http.get('*/account/me/', () => json(fx.currentUser)),
  http.get('*/account/available_applications/', () => json(fx.applications)),
  // Sem remotes/plugins federados no modo mock:
  http.get('*/frontend/plugins/', () => json([])),
  http.get('*/parameters/global/applications/', () => json(fx.parameterApps)),
  http.get('*/parameters/global/:app/', () => json({ params: {} })),

  // ----- webmail -----
  http.get('*/webmail/mailboxes/', () => json(fx.mailboxes)),
  http.get('*/webmail/mailboxes/unseen/', () => json({ counter: 0 })),
  http.get('*/webmail/mailboxes/quota/', () => json(fx.quota)),
  http.get('*/webmail/emails/', () => json(fx.emails)),

  // ----- admin (amostras) -----
  http.get('*/domains/', () => json(fx.domains)),
  http.get('*/identities/', () => json(fx.identities)),

  // ----- catch-all: mantém a app de pé em endpoints não mockados -----
  http.all('*/api/v2/*', ({ request }) => {
    const { pathname } = new URL(request.url)
    console.warn(`[mock] sem fixture: ${request.method} ${pathname}`)
    // Shape paginado vazio do DRF (cobre a maioria das listas).
    return json({ count: 0, next: null, previous: null, results: [] })
  }),
]
