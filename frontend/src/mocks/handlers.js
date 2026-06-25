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
  http.get('*/capabilities/', () =>
    json({
      capabilities: {
        imap_migration: {},
        rspamd: { location: '/rspamd' },
      },
    })
  ),
  http.get('*/theme/', () =>
    json({
      theme_primary_color: '#7c5cff',
      theme_primary_color_light: '#a594ff',
      theme_primary_color_dark: '#5a3fd6',
      theme_secondary_color: '#a594ff',
      theme_label_color: '#a3a3a3',
      theme_login_logo_url: null,
      theme_menu_logo_url: null,
      theme_creation_form_logo_url: null,
    })
  ),
  http.get('*/admin/news_feed/', () => json([])),
  http.get('*/admin/statistics/', () =>
    json({
      domain_count: 1,
      domain_alias_count: 0,
      account_count: 1,
      alias_count: 0,
    })
  ),
  http.get('*/admin/components/', () =>
    json([
      {
        name: 'modoboa',
        version: '3.0.0',
        last_version: '3.0.0',
        description: 'Core mail hosting platform',
        changelog_url: null,
        update: false,
      },
      {
        name: 'modoboa-webmail',
        version: '2.1.0',
        last_version: '2.1.0',
        description: 'Webmail plugin for Modoboa',
        changelog_url: null,
        update: false,
      },
    ])
  ),
  http.get('*/notifications/', () => json([])),
  http.get('*/alarms/', () => json(fx.alarms)),
  http.get('*/statistics/', () =>
    json({
      graphs: {
        averagetraffic: {
          title: 'Average Traffic',
          series: [
            {
              name: 'Received',
              data: [
                [1719266400000, 10],
                [1719270000000, 15],
                [1719273600000, 8],
              ],
            },
            {
              name: 'Sent',
              data: [
                [1719266400000, 5],
                [1719270000000, 12],
                [1719273600000, 14],
              ],
            },
          ],
        },
        averagetrafficsize: {
          title: 'Average Traffic Size (KB)',
          series: [
            {
              name: 'Size',
              data: [
                [1719266400000, 1024],
                [1719270000000, 2048],
                [1719273600000, 512],
              ],
            },
          ],
        },
        accountcreationgraphic: {
          title: 'Account Creations',
          series: [
            {
              name: 'Creations',
              data: [
                [1719266400000, 1],
                [1719270000000, 0],
                [1719273600000, 2],
              ],
            },
          ],
        },
      },
    })
  ),
  // Sem remotes/plugins federados no modo mock:
  http.get('*/frontend/plugins/', () => json([])),
  http.get('*/parameters/global/applications/', () => json(fx.parameterApps)),
  http.get('*/parameters/global/structure/', ({ request }) => {
    const url = new URL(request.url)
    const app = url.searchParams.get('app')
    if (app === 'core') {
      return json([
        {
          label: 'Geral',
          display: '',
          parameters: [
            {
              name: 'theme_primary_color',
              label: 'Cor Primária',
              help_text: 'Cor principal da interface',
              widget: 'ColorPicker',
              display: '',
            },
            {
              name: 'theme_secondary_color',
              label: 'Cor Secundária',
              help_text: 'Cor de destaque da interface',
              widget: 'ColorPicker',
              display: '',
            },
          ],
        },
      ])
    }
    if (app === 'imap_migration') {
      return json([
        {
          label: 'Migração IMAP',
          display: '',
          parameters: [
            {
              name: 'enabled_imapmigration',
              label: 'Ativar migração IMAP',
              help_text: 'Habilita migração IMAP para os domínios',
              widget: 'BooleanField',
              display: '',
            },
          ],
        },
      ])
    }
    return json([
      {
        label: 'Configurações',
        display: '',
        parameters: [],
      },
    ])
  }),
  http.get('*/parameters/global/:app/', ({ params }) => {
    if (params.app === 'imap_migration') {
      return json({
        label: 'Migração IMAP',
        params: { enabled_imapmigration: true },
      })
    }
    if (params.app === 'core') {
      return json({
        label: 'Geral',
        params: {
          theme_primary_color: '#046BF8',
          theme_secondary_color: '#F18429',
        },
      })
    }
    return json({ label: 'Configurações', params: {} })
  }),
  http.put('*/parameters/global/:app/', async ({ request, params }) => {
    const body = await request.json()
    return json({
      label:
        params.app === 'core'
          ? 'Geral'
          : params.app === 'imap_migration'
            ? 'Migração IMAP'
            : 'Configurações',
      params: body,
    })
  }),

  // ----- user parameters -----
  http.get('*/parameters/user/applications/', () => json(fx.userParameterApps)),
  http.get('*/parameters/user/structure/', ({ request }) => {
    const url = new URL(request.url)
    const app = url.searchParams.get('app')
    if (app === 'core') {
      return json([
        {
          label: 'Geral',
          display: '',
          parameters: [
            {
              name: 'items_per_page',
              label: 'Itens por página',
              help_text: 'Número de itens exibidos nas tabelas',
              widget: 'NumberField',
              display: '',
            },
          ],
        },
      ])
    }
    return json([])
  }),
  http.get('*/parameters/user/:app/', ({ params }) => {
    if (params.app === 'core') {
      return json({
        label: 'Geral',
        params: {
          items_per_page: 50,
        },
      })
    }
    return json({ label: 'Configurações', params: {} })
  }),
  http.put('*/parameters/user/:app/', async ({ request, params }) => {
    const body = await request.json()
    return json({
      label: params.app === 'core' ? 'Geral' : 'Configurações',
      params: body,
    })
  }),

  // ----- languages -----
  http.get('*/languages/', () =>
    json([
      { code: 'cs', label: 'Czech' },
      { code: 'de', label: 'German' },
      { code: 'el', label: 'Greek' },
      { code: 'en', label: 'English' },
      { code: 'es', label: 'Spanish' },
      { code: 'fi', label: 'Finnish' },
      { code: 'fr', label: 'French' },
      { code: 'it', label: 'Italian' },
      { code: 'ja', label: 'Japanese' },
      { code: 'nl', label: 'Dutch' },
      { code: 'pl', label: 'Polish' },
      { code: 'pt_BR', label: 'Portuguese (BR)' },
      { code: 'ru', label: 'Russian' },
      { code: 'sv', label: 'Swedish' },
      { code: 'zh', label: 'Chinese' },
    ])
  ),

  // ----- webmail -----
  http.get('*/webmail/mailboxes/', () => json(fx.mailboxes)),
  http.get('*/webmail/mailboxes/unseen/', () => json({ counter: 0 })),
  http.get('*/webmail/mailboxes/quota/', () => json(fx.quota)),
  http.get('*/webmail/emails/', () => json(fx.emails)),
  http.get('*/webmail/emails/content/', ({ request }) => {
    const url = new URL(request.url)
    const mailid = url.searchParams.get('mailid')

    let emailContent = {
      subject: 'Bem-vindo ao Modoboa (mock)',
      from_address: {
        fulladdress: 'noreply@example.com',
        address: 'noreply@example.com',
        name: 'Modoboa',
      },
      to: [
        {
          fulladdress: 'admin@example.com',
          address: 'admin@example.com',
          name: 'Dev Admin',
        },
      ],
      cc: [],
      body: '<h3>Bem-vindo ao Modoboa!</h3><p>Este é o corpo do e-mail de boas-vindas mockado em modo local.</p>',
      date: '2026-06-24T12:00:00Z',
      attachments: [],
    }

    if (mailid === '1') {
      emailContent = {
        subject: 'Relatório semanal',
        from_address: {
          fulladdress: 'reports@example.com',
          address: 'reports@example.com',
          name: 'Reports',
        },
        to: [
          {
            fulladdress: 'admin@example.com',
            address: 'admin@example.com',
            name: 'Dev Admin',
          },
        ],
        cc: [
          {
            fulladdress: 'manager@example.com',
            address: 'manager@example.com',
            name: 'Manager',
          },
        ],
        body: '<h3>Relatório Semanal</h3><p>Olá,</p><p>Aqui está o seu relatório de performance semanal mockado.</p>',
        date: '2026-06-23T08:30:00Z',
        attachments: [{ name: 'report.pdf', partnum: '2' }],
      }
    }

    return json(emailContent)
  }),

  // ----- admin (amostras) -----
  http.get('*/domains/', () => json(fx.domains)),
  http.get('*/identities/', () => json(fx.identities)),
  http.get('*/accounts/', () =>
    json({
      count: 1,
      next: null,
      previous: null,
      results: [
        {
          pk: 1,
          username: fx.currentUser.username,
          first_name: fx.currentUser.first_name,
          last_name: fx.currentUser.last_name,
          role: fx.currentUser.role,
          is_active: true,
        },
      ],
    })
  ),
  http.get('*/logs/audit-trail/', () =>
    json({
      count: 2,
      next: null,
      previous: null,
      results: [
        {
          date_created: '2026-06-24T12:00:00Z',
          level: 'INFO',
          logger: 'admin',
          message: 'Domain example.com created successfully',
        },
        {
          date_created: '2026-06-24T12:05:00Z',
          level: 'WARNING',
          logger: 'system',
          message: 'High disk space usage threshold warning',
        },
      ],
    })
  ),
  http.get('*/logs/messages/', () =>
    json({
      count: 2,
      next: null,
      previous: null,
      results: [
        {
          queue_id: 'A1B2C3D4',
          date: '2026-06-24T12:01:00Z',
          status: 'sent',
          rcpt: 'user@example.com',
          sender: 'admin@example.com',
        },
        {
          queue_id: 'E5F6G7H8',
          date: '2026-06-24T12:03:00Z',
          status: 'deferred',
          rcpt: 'customer@external.com',
          sender: 'user@example.com',
        },
      ],
    })
  ),

  // ----- email-providers -----
  http.get('*/email-providers/', () => json(fx.emailProviders)),
  http.get('*/email-providers/:id/', ({ params }) => {
    const p = fx.emailProviders.find((p) => p.id === Number(params.id))
    return p ? json(p) : new HttpResponse(null, { status: 404 })
  }),
  http.post('*/email-providers/', async ({ request }) => {
    const body = await request.json()
    const newProvider = {
      id: fx.emailProviders.length + 1,
      ...body,
      domains: [],
    }
    fx.emailProviders.push(newProvider)
    return json(newProvider)
  }),
  http.put('*/email-providers/:id/', async ({ request, params }) => {
    const body = await request.json()
    const idx = fx.emailProviders.findIndex((p) => p.id === Number(params.id))
    if (idx !== -1) {
      fx.emailProviders[idx] = { ...fx.emailProviders[idx], ...body }
      return json(fx.emailProviders[idx])
    }
    return new HttpResponse(null, { status: 404 })
  }),
  http.delete('*/email-providers/:id/', ({ params }) => {
    const idx = fx.emailProviders.findIndex((p) => p.id === Number(params.id))
    if (idx !== -1) {
      fx.emailProviders.splice(idx, 1)
    }
    return new HttpResponse(null, { status: 204 })
  }),

  // ----- migrations -----
  http.get('*/migrations/', () => json(fx.migrations)),
  http.delete('*/migrations/:id/', ({ params }) => {
    const idx = fx.migrations.findIndex((m) => m.id === Number(params.id))
    if (idx !== -1) {
      fx.migrations.splice(idx, 1)
    }
    return new HttpResponse(null, { status: 204 })
  }),

  // ----- FIDO (WebAuthn) -----
  http.get('*/fido/', () => json(fx.fidoCreds)),
  http.put('*/fido/:id/', async ({ request, params }) => {
    const body = await request.json()
    const idx = fx.fidoCreds.findIndex((c) => c.id === Number(params.id))
    if (idx !== -1) {
      fx.fidoCreds[idx] = { ...fx.fidoCreds[idx], ...body }
      return json(fx.fidoCreds[idx])
    }
    return new HttpResponse(null, { status: 404 })
  }),
  http.delete('*/fido/:id/', ({ params }) => {
    const idx = fx.fidoCreds.findIndex((c) => c.id === Number(params.id))
    if (idx !== -1) {
      fx.fidoCreds.splice(idx, 1)
    }
    return json({ tfa_enabled: false })
  }),

  // ----- forward -----
  http.get('*/account/forward/', () => json(fx.forward)),
  http.post('*/account/forward/', async ({ request }) => {
    const body = await request.json()
    Object.assign(fx.forward, body)
    return json(fx.forward)
  }),

  // ----- armessage -----
  http.get('*/account/armessage/', () => json(fx.armessage)),
  http.put('*/account/armessage/', async ({ request }) => {
    const body = await request.json()
    Object.assign(fx.armessage, body)
    return json(fx.armessage)
  }),

  // ----- api_token -----
  http.get('*/account/api_token/', () => json(fx.apiToken)),
  http.post('*/account/api_token/', () => {
    fx.apiToken.token = '8f7d9a3b5c6e1f0d2a4b6c8d0e2f4a6b8c0d2e4f'
    return json(fx.apiToken, { status: 201 })
  }),
  http.delete('*/account/api_token/', () => {
    fx.apiToken.token = null
    return new HttpResponse(null, { status: 204 })
  }),

  // ----- filtersets & filters -----
  http.get('*/account/filtersets/', () => json(fx.filtersets)),
  http.post('*/account/filtersets/', async ({ request }) => {
    const body = await request.json()
    const newFilterSet = { name: body.name, active: false }
    fx.filtersets.push(newFilterSet)
    fx.filtersMap[body.name] = []
    return json(newFilterSet)
  }),
  http.post('*/account/filtersets/deactivate_active/', () => {
    fx.filtersets.forEach((fs) => {
      fs.active = false
    })
    return json({ status: 'ok' })
  }),
  http.get('*/account/filtersets/condition_templates/', () =>
    json(fx.conditionTemplates)
  ),
  http.get('*/account/filtersets/action_templates/', () =>
    json(fx.actionTemplates)
  ),
  http.get('*/account/filtersets/:filterset/download/', ({ params }) => {
    return json(`# Sieve Filter file for ${params.filterset}\nkeep;`)
  }),
  http.put('*/account/filtersets/:filterset/', async () => {
    return json({ status: 'ok' })
  }),
  http.delete('*/account/filtersets/:filterset/', ({ params }) => {
    const idx = fx.filtersets.findIndex((fs) => fs.name === params.filterset)
    if (idx !== -1) {
      fx.filtersets.splice(idx, 1)
      delete fx.filtersMap[params.filterset]
    }
    return new HttpResponse(null, { status: 204 })
  }),
  http.post('*/account/filtersets/:filterset/activate/', ({ params }) => {
    fx.filtersets.forEach((fs) => {
      fs.active = fs.name === params.filterset
    })
    return json({ status: 'ok' })
  }),
  http.get('*/account/filtersets/:filterset/filters/', ({ params }) => {
    return json(fx.filtersMap[params.filterset] || [])
  }),
  http.post(
    '*/account/filtersets/:filterset/filters/',
    async ({ request, params }) => {
      const body = await request.json()
      if (!fx.filtersMap[params.filterset]) {
        fx.filtersMap[params.filterset] = []
      }
      const newFilter = { ...body, enabled: true }
      fx.filtersMap[params.filterset].push(newFilter)
      return json(newFilter)
    }
  ),
  http.put(
    '*/account/filtersets/:filterset/filters/:filter/',
    async ({ request, params }) => {
      const body = await request.json()
      const filtersList = fx.filtersMap[params.filterset] || []
      const idx = filtersList.findIndex((f) => f.name === params.filter)
      if (idx !== -1) {
        filtersList[idx] = { ...filtersList[idx], ...body }
        return json(filtersList[idx])
      }
      return new HttpResponse(null, { status: 404 })
    }
  ),
  http.delete(
    '*/account/filtersets/:filterset/filters/:filter/',
    ({ params }) => {
      const filtersList = fx.filtersMap[params.filterset] || []
      const idx = filtersList.findIndex((f) => f.name === params.filter)
      if (idx !== -1) {
        filtersList.splice(idx, 1)
      }
      return new HttpResponse(null, { status: 204 })
    }
  ),
  http.post(
    '*/account/filtersets/:filterset/filters/:filter/enable/',
    ({ params }) => {
      const filtersList = fx.filtersMap[params.filterset] || []
      const filterObj = filtersList.find((f) => f.name === params.filter)
      if (filterObj) {
        filterObj.enabled = true
      }
      return json({ status: 'ok' })
    }
  ),
  http.post(
    '*/account/filtersets/:filterset/filters/:filter/disable/',
    ({ params }) => {
      const filtersList = fx.filtersMap[params.filterset] || []
      const filterObj = filtersList.find((f) => f.name === params.filter)
      if (filterObj) {
        filterObj.enabled = false
      }
      return json({ status: 'ok' })
    }
  ),
  http.post(
    '*/account/filtersets/:filterset/filters/:filter/move_up/',
    ({ params }) => {
      const filtersList = fx.filtersMap[params.filterset] || []
      const idx = filtersList.findIndex((f) => f.name === params.filter)
      if (idx > 0) {
        const temp = filtersList[idx]
        filtersList[idx] = filtersList[idx - 1]
        filtersList[idx - 1] = temp
      }
      return json({ status: 'ok' })
    }
  ),
  http.post(
    '*/account/filtersets/:filterset/filters/:filter/move_down/',
    ({ params }) => {
      const filtersList = fx.filtersMap[params.filterset] || []
      const idx = filtersList.findIndex((f) => f.name === params.filter)
      if (idx !== -1 && idx < filtersList.length - 1) {
        const temp = filtersList[idx]
        filtersList[idx] = filtersList[idx + 1]
        filtersList[idx + 1] = temp
      }
      return json({ status: 'ok' })
    }
  ),

  // ----- catch-all: mantém a app de pé em endpoints não mockados -----
  http.all('*/api/v2/*', ({ request }) => {
    const { pathname } = new URL(request.url)
    console.warn(`[mock] sem fixture: ${request.method} ${pathname}`)
    // Shape paginado vazio do DRF (cobre a maioria das listas).
    return json({ count: 0, next: null, previous: null, results: [] })
  }),
]
